from __future__ import annotations

import re
from datetime import time
from typing import Tuple

from .parsing import (
    RaceBlockData,
    RaceEntryData,
    RawRowData,
    detect_category,
    derive_status,
    normalize_round_name,
    parse_distance_m,
    parse_time_of_day,
)

TIME_TOKEN = re.compile(r"^\d{1,2}:\d{2}\.\d{2}$")
SD_TOKEN = re.compile(r"^[A-Za-z0-9]{1,4}$")


def _is_header_line(line: str) -> bool:
    upper = line.upper()
    return "RACE" in upper and "LANE" in upper and "PL" in upper and "TIME" in upper


def _is_title_line(line: str) -> bool:
    upper = line.upper()
    return "DIVISION" in upper or "CUP" in upper


def _derive_division_name(title: str | None) -> str | None:
    if not title:
        return None
    upper = title.upper()
    has_cup = "CUP" in upper
    has_division = "DIVISION" in upper

    cleaned = re.sub(r"\b(2000M|500M|200M)\b", "", title, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bQUALIFYING\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bSEMI\s*FINAL\s*#?\d+\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bSEMI\s*FINAL\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bFINAL\b", "", cleaned, flags=re.IGNORECASE)

    if has_cup and not has_division:
        return " ".join(cleaned.split())

    cleaned = re.sub(r"\bCUP\b", "", cleaned, flags=re.IGNORECASE)
    return " ".join(cleaned.split())


def _parse_race_header(lines: list[str], start: int) -> tuple[int | None, time | None, int]:
    idx = start
    race_number = None
    scheduled_time = None

    while idx < len(lines):
        line = lines[idx].strip()
        if not line:
            idx += 1
            continue
        if _is_header_line(line):
            break

        tokens = line.split()
        if tokens and tokens[0].isdigit():
            race_number = int(tokens[0])
            scheduled_time = parse_time_of_day(line)
            idx += 1
            if scheduled_time is None and idx < len(lines):
                scheduled_time = parse_time_of_day(lines[idx])
                if scheduled_time:
                    idx += 1
            break
        idx += 1

    return race_number, scheduled_time, idx


def _parse_row(row_text: str) -> tuple[RaceEntryData | None, dict]:
    tokens = row_text.split()
    if not tokens or not tokens[0].isdigit():
        return None, {"reason": "missing_lane"}

    lane = int(tokens[0])
    time_index = None
    for idx in range(len(tokens) - 1, 0, -1):
        if TIME_TOKEN.match(tokens[idx]):
            time_index = idx
            break

    if time_index is None:
        return None, {"reason": "missing_time"}

    place_token = tokens[time_index - 1] if time_index - 1 >= 1 else None
    place = int(place_token) if place_token and place_token.isdigit() else None

    team_tokens = tokens[1:time_index - 1] if place is not None else tokens[1:time_index]
    seed_code = None
    if team_tokens and SD_TOKEN.match(team_tokens[0]) and len(team_tokens) >= 2:
        seed_code = team_tokens[0]
        team_tokens = team_tokens[1:]

    raw_team_text = " ".join(team_tokens).strip() or "UNKNOWN TEAM"
    time_display = tokens[time_index]
    status, time_ms = derive_status([row_text, raw_team_text], time_display, place)

    entry = RaceEntryData(
        lane=lane,
        seed_code=seed_code,
        raw_team_text=raw_team_text,
        place=place,
        time_display=time_display,
        time_ms=time_ms,
        status=status,
        rank=None,
    )
    return entry, {"lane": lane, "seed_code": seed_code, "time": time_display, "place": place}


def parse_tidbrf_page(text: str, page_number: int) -> Tuple[list[RaceBlockData], list[RawRowData]]:
    lines = [line.strip() for line in (text or "").splitlines()]
    race_blocks: list[RaceBlockData] = []
    raw_rows: list[RawRowData] = []

    idx = 0
    current_title = None
    while idx < len(lines):
        line = lines[idx].strip()
        if line and _is_title_line(line):
            current_title = line
        if _is_header_line(line):
            race_number, scheduled_time, idx = _parse_race_header(lines, idx + 1)
            title = current_title
            distance_m = parse_distance_m(title)
            category = detect_category(title)
            round_name = normalize_round_name(title)
            division_name = _derive_division_name(title)

            entries: list[RaceEntryData] = []
            current_row_lines: list[str] = []

            while idx < len(lines):
                row_line = lines[idx].strip()
                if _is_header_line(row_line):
                    break
                if not row_line:
                    idx += 1
                    continue
                if row_line and _is_title_line(row_line):
                    current_title = row_line
                if row_line and row_line[0].isdigit():
                    if current_row_lines:
                        combined = " ".join(current_row_lines)
                        entry, metadata = _parse_row(combined)
                        raw_rows.append(
                            RawRowData(
                                page_number=page_number,
                                race_number=race_number,
                                race_header_text=title,
                                row_text=combined,
                                row_json=metadata,
                            )
                        )
                        if entry:
                            entries.append(entry)
                        current_row_lines = []
                    current_row_lines = [row_line]
                else:
                    if current_row_lines:
                        current_row_lines.append(row_line)
                    else:
                        raw_rows.append(
                            RawRowData(
                                page_number=page_number,
                                race_number=race_number,
                                race_header_text=title,
                                row_text=row_line,
                                row_json={"reason": "orphan_line"},
                            )
                        )
                if current_row_lines:
                    combined = " ".join(current_row_lines)
                    entry, metadata = _parse_row(combined)
                    if entry:
                        raw_rows.append(
                            RawRowData(
                                page_number=page_number,
                                race_number=race_number,
                                race_header_text=title,
                                row_text=combined,
                                row_json=metadata,
                            )
                        )
                        entries.append(entry)
                        current_row_lines = []
                idx += 1

            if current_row_lines:
                combined = " ".join(current_row_lines)
                entry, metadata = _parse_row(combined)
                raw_rows.append(
                    RawRowData(
                        page_number=page_number,
                        race_number=race_number,
                        race_header_text=title,
                        row_text=combined,
                        row_json=metadata,
                    )
                )
                if entry:
                    entries.append(entry)

            if race_number is not None:
                race_blocks.append(
                    RaceBlockData(
                        race_number=race_number,
                        race_name=title,
                        round_name=round_name,
                        race_date=None,
                        scheduled_time_local=scheduled_time,
                        actual_time_local=None,
                        category=category,
                        distance_m=distance_m,
                        division_name=division_name,
                        event_class_notes=None,
                        page_number=page_number,
                        entries=entries,
                        raw_header_text=title,
                    )
                )
            continue
        idx += 1

    return race_blocks, raw_rows
