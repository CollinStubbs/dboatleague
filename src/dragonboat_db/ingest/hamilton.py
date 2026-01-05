from __future__ import annotations

import re
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


def _next_nonempty(lines: list[str], start: int) -> tuple[int, str | None]:
    idx = start
    while idx < len(lines):
        if lines[idx].strip():
            return idx, lines[idx].strip()
        idx += 1
    return idx, None


def _parse_row(line: str) -> tuple[RaceEntryData | None, dict]:
    tokens = line.split()
    if not tokens:
        return None, {"reason": "empty"}
    if not tokens[0].isdigit():
        return None, {"reason": "missing_lane"}
    lane = int(tokens[0])

    time_index = None
    for idx in range(len(tokens) - 1, 0, -1):
        if TIME_TOKEN.match(tokens[idx]):
            time_index = idx
            break

    if time_index is None:
        return None, {"reason": "missing_time"}

    rank = None
    if time_index + 1 < len(tokens) and tokens[time_index + 1].isdigit():
        rank = int(tokens[time_index + 1])

    team_tokens = tokens[1:time_index]
    raw_team_text = " ".join(team_tokens).strip()

    time_display = tokens[time_index]
    status, time_ms = derive_status([raw_team_text, time_display], time_display, None)

    entry = RaceEntryData(
        lane=lane,
        seed_code=None,
        raw_team_text=raw_team_text or "UNKNOWN TEAM",
        place=None,
        time_display=time_display,
        time_ms=time_ms,
        status=status,
        rank=rank,
    )
    return entry, {"lane": lane, "time": time_display, "rank": rank}


def parse_hamilton_page(text: str, page_number: int) -> Tuple[list[RaceBlockData], list[RawRowData]]:
    lines = [line.strip() for line in (text or "").splitlines()]
    race_blocks: list[RaceBlockData] = []
    raw_rows: list[RawRowData] = []

    idx = 0
    while idx < len(lines):
        line = lines[idx].strip()
        if line.lower() == "race":
            idx, race_number_line = _next_nonempty(lines, idx + 1)
            if not race_number_line or not race_number_line.isdigit():
                idx += 1
                continue
            race_number = int(race_number_line)

            idx, title_line = _next_nonempty(lines, idx + 1)
            idx, distance_line = _next_nonempty(lines, idx + 1)
            race_name = title_line
            scheduled_time = None
            if title_line:
                time_match = re.search(r"(\d{1,2}:\d{2})$", title_line)
                if time_match:
                    scheduled_time = parse_time_of_day(time_match.group(1))
                    race_name = title_line[: time_match.start()].strip() or title_line

            actual_time = None
            if distance_line:
                actual_match = re.search(r"Actual time:\s*([0-9]{1,2}:[0-9]{2})", distance_line)
                if actual_match:
                    actual_time = parse_time_of_day(actual_match.group(1))

            distance_m = parse_distance_m(distance_line)
            round_name = normalize_round_name(distance_line or "")
            category = detect_category(race_name or "")
            division_name = race_name

            header_idx = idx
            header_found = False
            while header_idx < len(lines):
                header_line = lines[header_idx].lower()
                if "lane" in header_line and "team" in header_line:
                    header_found = True
                    header_idx += 1
                    break
                if header_line.lower() == "race" and header_idx != idx:
                    break
                header_idx += 1

            entries: list[RaceEntryData] = []
            while header_found and header_idx < len(lines):
                row_line = lines[header_idx].strip()
                if not row_line:
                    header_idx += 1
                    continue
                if row_line.lower() == "race":
                    break
                if row_line.upper().startswith("NOTE") or row_line.upper().startswith("COURSE BREAK"):
                    raw_rows.append(
                        RawRowData(
                            page_number=page_number,
                            race_number=race_number,
                            race_header_text=title_line,
                            row_text=row_line,
                            row_json={"type": "note"},
                        )
                    )
                    header_idx += 1
                    continue

                entry, metadata = _parse_row(row_line)
                raw_rows.append(
                    RawRowData(
                        page_number=page_number,
                        race_number=race_number,
                        race_header_text=title_line,
                        row_text=row_line,
                        row_json=metadata,
                    )
                )
                if entry:
                    entries.append(entry)
                header_idx += 1

            race_blocks.append(
                RaceBlockData(
                    race_number=race_number,
                    race_name=race_name,
                    round_name=round_name,
                    race_date=None,
                    scheduled_time_local=scheduled_time,
                    actual_time_local=actual_time,
                    category=category,
                    distance_m=distance_m,
                    division_name=division_name,
                    event_class_notes=None,
                    page_number=page_number,
                    entries=entries,
                    raw_header_text=title_line,
                )
            )
            idx = header_idx
            continue
        idx += 1

    return race_blocks, raw_rows
