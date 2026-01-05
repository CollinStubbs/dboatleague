from __future__ import annotations

import hashlib
import logging
import uuid
from datetime import date
from typing import Tuple

import pdfplumber
from sqlalchemy import select

from dragonboat_db.db import get_session_factory
from dragonboat_db.models import (
    Division,
    EventClass,
    ImportFile,
    Race,
    RaceEntry,
    RawRaceRow,
    Regatta,
    Team,
    TeamAlias,
)
from .gwnc import parse_gwnc_page
from .hamilton import parse_hamilton_page
from .tidbrf import parse_tidbrf_page
from .parsing import RaceBlockData, RawRowData, canonicalize_team_name

logger = logging.getLogger(__name__)


def detect_layout(text: str) -> str:
    upper = (text or "").upper()
    if "RACE PROGRESSION" in upper:
        return "hamilton"
    if "RACE LN" in upper and "PLC TIME" in upper:
        return "gwnc"
    if "RACE LANE SD" in upper and "PL TIME" in upper:
        return "tidbrf"
    if "ACTUAL TIME" in upper and "LANE" in upper and "TEAM" in upper:
        return "hamilton"
    return "unknown"


def parse_pdf(pdf_path: str) -> Tuple[list[RaceBlockData], list[RawRowData]]:
    race_blocks: list[RaceBlockData] = []
    raw_rows: list[RawRowData] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            layout = detect_layout(text)
            if layout == "hamilton":
                blocks, rows = parse_hamilton_page(text, page_number)
            elif layout == "gwnc":
                blocks, rows = parse_gwnc_page(text, page_number)
            elif layout == "tidbrf":
                blocks, rows = parse_tidbrf_page(text, page_number)
            else:
                logger.info("Skipping page %s: unknown layout", page_number)
                continue

            race_blocks.extend(blocks)
            raw_rows.extend(rows)

    return race_blocks, raw_rows


def _compute_sha256(path: str) -> str:
    hasher = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _get_or_create_regatta(session, name: str, venue: str | None, location: str | None, start_date: date | None, end_date: date | None) -> Regatta:
    query = select(Regatta).where(Regatta.name == name)
    if start_date is not None:
        query = query.where(Regatta.start_date == start_date)
    result = session.execute(query).scalars().first()
    if result:
        if venue and not result.venue:
            result.venue = venue
        if location and not result.location:
            result.location = location
        if end_date and not result.end_date:
            result.end_date = end_date
        return result

    regatta = Regatta(
        name=name,
        venue=venue,
        location=location,
        start_date=start_date,
        end_date=end_date,
    )
    session.add(regatta)
    return regatta


def _get_or_create_event_class(
    session,
    category: str | None,
    distance_m: int | None,
    boat_class: str | None,
    cache: dict | None = None,
) -> EventClass:
    key = (category, distance_m, boat_class)
    if cache is not None and key in cache:
        return cache[key]
    query = select(EventClass).where(
        EventClass.category == category,
        EventClass.distance_m == distance_m,
        EventClass.boat_class == boat_class,
    )
    result = session.execute(query).scalars().first()
    if result:
        if cache is not None:
            cache[key] = result
        return result
    event_class = EventClass(id=uuid.uuid4(), category=category, distance_m=distance_m, boat_class=boat_class)
    session.add(event_class)
    if cache is not None:
        cache[key] = event_class
    return event_class


def _get_or_create_division(
    session,
    regatta_id,
    name: str | None,
    cache: dict | None = None,
) -> Division | None:
    if not name:
        return None
    key = (regatta_id, name)
    if cache is not None and key in cache:
        return cache[key]
    query = select(Division).where(Division.regatta_id == regatta_id, Division.name == name)
    result = session.execute(query).scalars().first()
    if result:
        if cache is not None:
            cache[key] = result
        return result
    division = Division(id=uuid.uuid4(), regatta_id=regatta_id, name=name)
    session.add(division)
    if cache is not None:
        cache[key] = division
    return division


def _get_or_create_race(
    session,
    regatta_id,
    block: RaceBlockData,
    event_class_id,
    division_id,
    cache: dict | None = None,
) -> Race:
    key = (regatta_id, block.race_number)
    if cache is not None and key in cache:
        return cache[key]
    query = select(Race).where(Race.regatta_id == regatta_id, Race.race_number == block.race_number)
    result = session.execute(query).scalars().first()
    if result:
        result.race_name = result.race_name or block.race_name
        result.round_name = result.round_name or block.round_name
        result.race_date = result.race_date or block.race_date
        result.scheduled_time_local = result.scheduled_time_local or block.scheduled_time_local
        result.actual_time_local = result.actual_time_local or block.actual_time_local
        result.event_class_id = result.event_class_id or event_class_id
        result.division_id = result.division_id or division_id
        result.page_number = result.page_number or block.page_number
        if cache is not None:
            cache[key] = result
        return result

    race = Race(
        id=uuid.uuid4(),
        regatta_id=regatta_id,
        race_number=block.race_number,
        race_name=block.race_name,
        round_name=block.round_name,
        race_date=block.race_date,
        scheduled_time_local=block.scheduled_time_local,
        actual_time_local=block.actual_time_local,
        event_class_id=event_class_id,
        division_id=division_id,
        page_number=block.page_number,
    )
    session.add(race)
    if cache is not None:
        cache[key] = race
    return race


def _get_or_create_team(
    session,
    raw_team_text: str,
    cache: dict | None = None,
) -> tuple[Team | None, str]:
    canonical = canonicalize_team_name(raw_team_text)
    if not canonical:
        return None, canonical
    if cache is not None and canonical in cache:
        return cache[canonical], canonical
    query = select(Team).where(Team.canonical_name == canonical)
    result = session.execute(query).scalars().first()
    if result:
        if cache is not None:
            cache[canonical] = result
        return result, canonical
    team = Team(id=uuid.uuid4(), canonical_name=canonical)
    session.add(team)
    if cache is not None:
        cache[canonical] = team
    return team, canonical


def _ensure_alias(session, team_id, alias_text: str, cache: set | None = None) -> None:
    if not alias_text:
        return
    key = (team_id, alias_text)
    if cache is not None and key in cache:
        return
    query = select(TeamAlias).where(TeamAlias.team_id == team_id, TeamAlias.alias_text == alias_text)
    if session.execute(query).scalars().first():
        if cache is not None:
            cache.add(key)
        return
    session.add(TeamAlias(team_id=team_id, alias_text=alias_text))
    if cache is not None:
        cache.add(key)


def ingest_pdf(
    db_url: str,
    pdf_path: str,
    regatta_name: str,
    venue: str | None = None,
    location: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> None:
    session_factory = get_session_factory(db_url)
    with session_factory() as session:
        division_cache: dict[tuple, Division] = {}
        event_class_cache: dict[tuple, EventClass] = {}
        race_cache: dict[tuple, Race] = {}
        team_cache: dict[str, Team] = {}
        alias_cache: set[tuple] = set()
        race_entry_cache: dict[tuple, RaceEntry] = {}

        sha256 = _compute_sha256(pdf_path)
        existing = session.execute(select(ImportFile).where(ImportFile.sha256 == sha256)).scalars().first()
        if existing:
            logger.info("File already imported: %s", pdf_path)
            return

        regatta = _get_or_create_regatta(session, regatta_name, venue, location, start_date, end_date)
        import_file = ImportFile(id=uuid.uuid4(), filename=pdf_path, sha256=sha256, regatta_id=regatta.id)
        session.add(import_file)

        race_blocks, raw_rows = parse_pdf(pdf_path)
        logger.info("Detected %s races and %s raw rows", len(race_blocks), len(raw_rows))

        for raw_row in raw_rows:
            session.add(
                RawRaceRow(
                    import_file_id=import_file.id,
                    page_number=raw_row.page_number,
                    race_number=raw_row.race_number,
                    race_header_text=raw_row.race_header_text,
                    row_text=raw_row.row_text,
                    row_json=raw_row.row_json,
                )
            )

        for block in race_blocks:
            event_class = _get_or_create_event_class(
                session,
                block.category,
                block.distance_m,
                "Unknown",
                cache=event_class_cache,
            )
            division = _get_or_create_division(session, regatta.id, block.division_name, cache=division_cache)
            race = _get_or_create_race(
                session,
                regatta.id,
                block,
                event_class.id,
                division.id if division else None,
                cache=race_cache,
            )

            for entry in block.entries:
                existing_entry = None
                cache_key = None
                if entry.lane is not None:
                    cache_key = (race.id, entry.lane)
                    if cache_key in race_entry_cache:
                        existing_entry = race_entry_cache[cache_key]
                if entry.lane is not None and existing_entry is None:
                    existing_entry = session.execute(
                        select(RaceEntry).where(RaceEntry.race_id == race.id, RaceEntry.lane == entry.lane)
                    ).scalars().first()
                    if existing_entry and cache_key is not None:
                        race_entry_cache[cache_key] = existing_entry

                team = None
                canonical = ""
                if entry.raw_team_text:
                    team, canonical = _get_or_create_team(session, entry.raw_team_text, cache=team_cache)
                    if team and canonical and canonical != entry.raw_team_text:
                        _ensure_alias(session, team.id, entry.raw_team_text, cache=alias_cache)

                if existing_entry:
                    existing_entry.seed_code = existing_entry.seed_code or entry.seed_code
                    existing_entry.team_id = existing_entry.team_id or (team.id if team else None)
                    existing_entry.raw_team_text = entry.raw_team_text or existing_entry.raw_team_text
                    existing_entry.place = existing_entry.place or entry.place
                    existing_entry.time_display = existing_entry.time_display or entry.time_display
                    existing_entry.time_ms = existing_entry.time_ms or entry.time_ms
                    existing_entry.status = existing_entry.status if existing_entry.status != "UNKNOWN" else entry.status
                    existing_entry.rank = existing_entry.rank or entry.rank
                else:
                    new_entry = RaceEntry(
                        id=uuid.uuid4(),
                        race_id=race.id,
                        lane=entry.lane,
                        seed_code=entry.seed_code,
                        team_id=team.id if team else None,
                        raw_team_text=entry.raw_team_text,
                        place=entry.place,
                        time_display=entry.time_display,
                        time_ms=entry.time_ms,
                        status=entry.status,
                        rank=entry.rank,
                    )
                    session.add(new_entry)
                    if cache_key is not None:
                        race_entry_cache[cache_key] = new_entry

        session.commit()
