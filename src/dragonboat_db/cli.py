from __future__ import annotations

import csv
import logging
import os
import uuid
from datetime import date

import typer
from alembic import command
from alembic.config import Config
from sqlalchemy import select

from dragonboat_db.db import get_session_factory
from dragonboat_db.models import Division, EventClass, Race, RaceEntry, Regatta, Team
from dragonboat_db.ingest.pdf_ingest import ingest_pdf

app = typer.Typer(add_completion=False)
db_app = typer.Typer(add_completion=False)
ingest_app = typer.Typer(add_completion=False)
export_app = typer.Typer(add_completion=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_typer(db_app, name="db")
app.add_typer(ingest_app, name="ingest")
app.add_typer(export_app, name="export")


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


@db_app.command("init")
def db_init(db_url: str = typer.Option("sqlite:///dragonboat.db", "--db-url")) -> None:
    """Run Alembic migrations."""
    config = Config("alembic.ini")
    os.environ["DB_URL"] = db_url
    command.upgrade(config, "head")
    logger.info("Database initialized")


@ingest_app.command("pdf")
def ingest_pdf_cmd(
    db_url: str = typer.Option(..., "--db-url"),
    pdf: str = typer.Option(..., "--pdf"),
    regatta_name: str = typer.Option(..., "--regatta-name"),
    venue: str | None = typer.Option(None, "--venue"),
    location: str | None = typer.Option(None, "--location"),
    start_date: str | None = typer.Option(None, "--start-date"),
    end_date: str | None = typer.Option(None, "--end-date"),
) -> None:
    """Ingest a regatta results PDF."""
    ingest_pdf(
        db_url=db_url,
        pdf_path=pdf,
        regatta_name=regatta_name,
        venue=venue,
        location=location,
        start_date=_parse_date(start_date),
        end_date=_parse_date(end_date),
    )
    logger.info("Ingestion complete")


@export_app.command("csv")
def export_csv(
    db_url: str = typer.Option(..., "--db-url"),
    regatta_id: str = typer.Option(..., "--regatta-id"),
    out: str = typer.Option(..., "--out"),
) -> None:
    """Export flattened results to CSV."""
    regatta_uuid = uuid.UUID(regatta_id)
    session_factory = get_session_factory(db_url)
    with session_factory() as session:
        stmt = (
            select(
                Regatta.name.label("regatta_name"),
                Race.race_number,
                Race.race_name,
                Race.race_date,
                Race.scheduled_time_local,
                Race.actual_time_local,
                EventClass.category,
                EventClass.distance_m,
                Division.name.label("division_name"),
                Race.round_name,
                RaceEntry.lane,
                RaceEntry.seed_code,
                RaceEntry.raw_team_text,
                Team.canonical_name.label("canonical_team_name"),
                RaceEntry.place,
                RaceEntry.rank,
                RaceEntry.time_display,
                RaceEntry.time_ms,
                RaceEntry.status,
            )
            .join(Race, Race.regatta_id == Regatta.id)
            .join(RaceEntry, RaceEntry.race_id == Race.id)
            .outerjoin(EventClass, Race.event_class_id == EventClass.id)
            .outerjoin(Division, Race.division_id == Division.id)
            .outerjoin(Team, RaceEntry.team_id == Team.id)
            .where(Regatta.id == regatta_uuid)
            .order_by(Race.race_number, RaceEntry.lane)
        )

        rows = session.execute(stmt).all()

    fieldnames = [
        "regatta_name",
        "race_number",
        "race_name",
        "race_date",
        "scheduled_time_local",
        "actual_time_local",
        "category",
        "distance_m",
        "division_name",
        "round_name",
        "lane",
        "seed_code",
        "raw_team_text",
        "canonical_team_name",
        "place",
        "rank",
        "time_display",
        "time_ms",
        "status",
    ]

    with open(out, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: getattr(row, key) for key in fieldnames})

    logger.info("Exported %s rows to %s", len(rows), out)
