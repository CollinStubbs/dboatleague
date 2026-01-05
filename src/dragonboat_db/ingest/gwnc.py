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
HEADER_TOKEN = re.compile(r"^RACE\s+LN\b", re.IGNORECASE)
RACE_NUMBER_TOKEN = re.compile(r"RACE\s*#\s*(\d+)", re.IGNORECASE)
TIME_PREFIX = re.compile(r"^(?P<time>\d{1,2}:\d{2}(?::\d{2})?\s*(AM|PM))\s+(?P<rest>.+)$", re.IGNORECASE)
TIME_ONLY = re.compile(r"^\d{1,2}:\d{2}(?::\d{2})?\s*(AM|PM)$", re.IGNORECASE)


def _is_header_line(line: str) -> bool:
    upper = line.upper()
    return HEADER_TOKEN.match(line) and "PLC" in upper and "TIME" in upper


def _next_nonempty(lines: list[str], start: int) -> tuple[int, str | None]:
    idx = start
    while idx < len(lines):
        if lines[idx].strip():
            return idx, lines[idx].strip()
        idx += 1
    return idx, None


def _extract_race_number(title: str | None) -> int | None:
    if not title:
        return None
    match = RACE_NUMBER_TOKEN.search(title)
    if match:
        return int(match.group(1))
    return None


def _strip_time_prefix(line: str) -> tuple[str, time | None]:
    if TIME_ONLY.match(line):
        return "", parse_time_of_day(line)
    match = TIME_PREFIX.match(line)
    if match:
        return match.group("rest").strip(), parse_time_of_day(match.group("time"))
    return line, None


def _derive_division_name(title: str | None) -> str | None:
    if not title:
        return None
    upper = title.upper()
    if "BCP" in upper:
        return "BCP"
    if "MIXED" in upper:
        return "Mixed"
    if "WOMEN" in upper:
        return "Women"
    if "OPEN" in upper:
        return "Open"
    return None


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
    raw_team_text = " ".join(team_tokens).strip() or "UNKNOWN TEAM"
    time_display = tokens[time_index]
    status, time_ms = derive_status([row_text, raw_team_text], time_display, place)

    entry = RaceEntryData(
        lane=lane,
        seed_code=None,
        raw_team_text=raw_team_text,
        place=place,
        time_display=time_display,
        time_ms=time_ms,
        status=status,
        rank=None,
    )
    return entry, {"lane": lane, "time": time_display, "place": place}


def parse_gwnc_page(text: str, page_number: int) -> Tuple[list[RaceBlockData], list[RawRowData]]:
    lines = [line.strip() for line in (text or "").splitlines()]
    race_blocks: list[RaceBlockData] = []
    raw_rows: list[RawRowData] = []

    idx = 0
    while idx < len(lines):
        line = lines[idx].strip()
        if _is_header_line(line):
            title = line
            distance_m = parse_distance_m(title)
            category = detect_category(title)
            round_name = normalize_round_name(title)
            division_name = _derive_division_name(title)
            race_number = _extract_race_number(title)
            scheduled_time = None

            idx += 1
            if race_number is None:
                number_idx, number_line = _next_nonempty(lines, idx)
                if number_line:
                    tokens = number_line.split()
                    if tokens and tokens[0].isdigit():
                        race_number = int(tokens[0])
                        raw_rows.append(
                            RawRowData(
                                page_number=page_number,
                                race_number=race_number,
                                race_header_text=title,
                                row_text=number_line,
                                row_json={"type": "race_number_line"},
                            )
                        )
                        idx = number_idx + 1

            entries: list[RaceEntryData] = []
            current_row_lines: list[str] = []

            while idx < len(lines):
                row_line = lines[idx].strip()
                if _is_header_line(row_line):
                    break
                if not row_line:
                    idx += 1
                    continue

                trimmed_line, time_of_day = _strip_time_prefix(row_line)
                if time_of_day and scheduled_time is None:
                    scheduled_time = time_of_day

                if not trimmed_line:
                    raw_rows.append(
                        RawRowData(
                            page_number=page_number,
                            race_number=race_number,
                            race_header_text=title,
                            row_text=row_line,
                            row_json={"reason": "time_only"},
                        )
                    )
                    idx += 1
                    continue

                if trimmed_line[0].isdigit():
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
                    current_row_lines = [trimmed_line]
                else:
                    if current_row_lines:
                        current_row_lines.append(trimmed_line)
                    else:
                        raw_rows.append(
                            RawRowData(
                                page_number=page_number,
                                race_number=race_number,
                                race_header_text=title,
                                row_text=trimmed_line,
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
