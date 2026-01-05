from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, time
from typing import Iterable

STATUS_CODES = {"DNS", "DNF", "DQ", "DS"}
INVALID_TIME = "10:00.00"


@dataclass
class RaceEntryData:
    lane: int | None
    seed_code: str | None
    raw_team_text: str
    place: int | None
    time_display: str | None
    time_ms: int | None
    status: str
    rank: int | None


@dataclass
class RaceBlockData:
    race_number: int
    race_name: str | None
    round_name: str | None
    race_date: date | None
    scheduled_time_local: time | None
    actual_time_local: time | None
    category: str | None
    distance_m: int | None
    division_name: str | None
    event_class_notes: str | None
    page_number: int | None
    entries: list[RaceEntryData]
    raw_header_text: str | None


@dataclass
class RawRowData:
    page_number: int
    race_number: int | None
    race_header_text: str | None
    row_text: str | None
    row_json: dict | None


def canonicalize_team_name(raw: str) -> str:
    cleaned = re.sub(r"\s+", " ", raw or "").strip()
    cleaned = re.sub(r"\s*\(\d+\)$", "", cleaned).strip()
    tag_match = re.search(r"\s*\(([A-Za-z]{1,3})\)$", cleaned)
    if tag_match and tag_match.group(1).upper() in {"S", "DS"}:
        cleaned = re.sub(r"\s*\([A-Za-z]{1,3}\)$", "", cleaned).strip()
    return cleaned


def parse_time_to_ms(time_display: str | None) -> int | None:
    if not time_display:
        return None
    value = time_display.strip()
    match = re.match(r"^(\d{1,2}):(\d{2})\.(\d{2})$", value)
    if match:
        minutes = int(match.group(1))
        seconds = int(match.group(2))
        hundredths = int(match.group(3))
        return int((minutes * 60 + seconds) * 1000 + hundredths * 10)

    match = re.match(r"^(\d{1,2})\.(\d{2})$", value)
    if match:
        seconds = int(match.group(1))
        hundredths = int(match.group(2))
        return int(seconds * 1000 + hundredths * 10)

    return None


def derive_status(fields: Iterable[str], time_display: str | None, place: int | None) -> tuple[str, int | None]:
    upper_blob = " ".join(fields).upper()
    for code in STATUS_CODES:
        if code in upper_blob:
            return code, None

    if time_display and time_display.strip() == INVALID_TIME:
        return "INVALID_TIME", None

    time_ms = parse_time_to_ms(time_display)
    if time_ms is not None:
        return "OK", time_ms

    if place is None and not time_display:
        return "UNKNOWN", None

    return "UNKNOWN", None


def parse_time_of_day(text: str | None) -> time | None:
    if not text:
        return None
    value = text.strip().upper()
    match = re.search(r"(\d{1,2}):(\d{2})\s*(AM|PM)?", value)
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2))
    meridiem = match.group(3)
    if meridiem:
        if meridiem == "PM" and hour != 12:
            hour += 12
        if meridiem == "AM" and hour == 12:
            hour = 0
    return time(hour=hour, minute=minute)


def parse_distance_m(text: str | None) -> int | None:
    if not text:
        return None
    match = re.search(r"(2000|500|200)\s*m", text.lower())
    if match:
        return int(match.group(1))
    return None


def detect_category(text: str | None) -> str | None:
    if not text:
        return None
    upper = text.upper()
    if "MIXED" in upper:
        return "Mixed"
    if "WOMEN" in upper:
        return "Women"
    if "OPEN" in upper:
        return "Open"
    if "JUNIOR" in upper:
        return "Junior"
    if "UNIVERSITY" in upper:
        return "University"
    if "CUP" in upper:
        return "Cup"
    return None


def normalize_round_name(text: str | None) -> str | None:
    if not text:
        return None
    upper = text.upper()
    if "QUALIFY" in upper:
        return "Qualifying"
    if "SEMI" in upper:
        match = re.search(r"SEMI\s*FINAL\s*#?\d+", upper)
        if match:
            return match.group(0).title()
        return "Semi Final"
    if "CHAMPIONSHIP" in upper:
        return "Championship"
    if "FINAL" in upper:
        return "Final"
    if "PRELIM" in upper:
        return "Preliminary"
    if "CUP" in upper:
        return "Cup"
    return None
