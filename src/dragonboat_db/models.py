from __future__ import annotations

import uuid

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, Time, UniqueConstraint, Index, func
from sqlalchemy import JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import Uuid


class Base(DeclarativeBase):
    pass


class Regatta(Base):
    __tablename__ = "regatta"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    venue: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[Date | None] = mapped_column(Date)
    end_date: Mapped[Date | None] = mapped_column(Date)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    races: Mapped[list["Race"]] = relationship(back_populates="regatta")


class ImportFile(Base):
    __tablename__ = "import_file"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    imported_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    regatta_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("regatta.id"))

    regatta: Mapped[Regatta | None] = relationship()


class RawRaceRow(Base):
    __tablename__ = "raw_race_row"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    import_file_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("import_file.id"), nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    race_number: Mapped[int | None] = mapped_column(Integer)
    race_header_text: Mapped[str | None] = mapped_column(Text)
    row_text: Mapped[str | None] = mapped_column(Text)
    row_json: Mapped[dict | None] = mapped_column(JSON)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    import_file: Mapped[ImportFile] = relationship()

    __table_args__ = (
        Index("ix_raw_race_row_import_file_id", "import_file_id"),
        Index("ix_raw_race_row_race_number", "race_number"),
    )


class EventClass(Base):
    __tablename__ = "event_class"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category: Mapped[str | None] = mapped_column(Text)
    distance_m: Mapped[int | None] = mapped_column(Integer)
    boat_class: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        UniqueConstraint("category", "distance_m", "boat_class", name="uq_event_class"),
    )


class Division(Base):
    __tablename__ = "division"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    regatta_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("regatta.id"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)

    regatta: Mapped[Regatta] = relationship()

    __table_args__ = (
        UniqueConstraint("regatta_id", "name", name="uq_division_regatta_name"),
    )


class Race(Base):
    __tablename__ = "race"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    regatta_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("regatta.id"), nullable=False)
    race_number: Mapped[int] = mapped_column(Integer, nullable=False)
    race_name: Mapped[str | None] = mapped_column(Text)
    round_name: Mapped[str | None] = mapped_column(Text)
    race_date: Mapped[Date | None] = mapped_column(Date)
    scheduled_time_local: Mapped[Time | None] = mapped_column(Time)
    actual_time_local: Mapped[Time | None] = mapped_column(Time)
    event_class_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("event_class.id"))
    division_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("division.id"))
    page_number: Mapped[int | None] = mapped_column(Integer)

    regatta: Mapped[Regatta] = relationship(back_populates="races")
    event_class: Mapped[EventClass | None] = relationship()
    division: Mapped[Division | None] = relationship()

    __table_args__ = (
        UniqueConstraint("regatta_id", "race_number", name="uq_race_regatta_number"),
    )


class Team(Base):
    __tablename__ = "team"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_name: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class TeamAlias(Base):
    __tablename__ = "team_alias"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("team.id"), nullable=False)
    alias_text: Mapped[str] = mapped_column(Text, nullable=False)

    team: Mapped[Team] = relationship()

    __table_args__ = (
        UniqueConstraint("team_id", "alias_text", name="uq_team_alias_team_text"),
        Index("ix_team_alias_alias_text", "alias_text"),
    )


class RaceEntry(Base):
    __tablename__ = "race_entry"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    race_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("race.id"), nullable=False)
    lane: Mapped[int | None] = mapped_column(Integer)
    seed_code: Mapped[str | None] = mapped_column(Text)
    team_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("team.id"))
    raw_team_text: Mapped[str] = mapped_column(Text, nullable=False)
    place: Mapped[int | None] = mapped_column(Integer)
    time_display: Mapped[str | None] = mapped_column(Text)
    time_ms: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Text, nullable=False, server_default="UNKNOWN")
    rank: Mapped[int | None] = mapped_column(Integer)

    race: Mapped[Race] = relationship()
    team: Mapped[Team | None] = relationship()

    __table_args__ = (
        Index("ix_race_entry_race_id", "race_id"),
        Index("ix_race_entry_team_id", "team_id"),
        Index(
            "uq_race_entry_race_lane",
            "race_id",
            "lane",
            unique=True,
            postgresql_where=(lane.is_not(None)),
        ),
    )
