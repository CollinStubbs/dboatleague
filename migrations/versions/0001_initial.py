"""initial schema

Revision ID: 0001_initial
Revises: None
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "regatta",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("venue", sa.Text()),
        sa.Column("location", sa.Text()),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "import_file",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("filename", sa.Text(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False, unique=True),
        sa.Column("imported_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("regatta_id", sa.Uuid(as_uuid=True), sa.ForeignKey("regatta.id")),
    )

    op.create_table(
        "raw_race_row",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("import_file_id", sa.Uuid(as_uuid=True), sa.ForeignKey("import_file.id"), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("race_number", sa.Integer()),
        sa.Column("race_header_text", sa.Text()),
        sa.Column("row_text", sa.Text()),
        sa.Column("row_json", sa.JSON()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_raw_race_row_import_file_id", "raw_race_row", ["import_file_id"])
    op.create_index("ix_raw_race_row_race_number", "raw_race_row", ["race_number"])

    op.create_table(
        "event_class",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("category", sa.Text()),
        sa.Column("distance_m", sa.Integer()),
        sa.Column("boat_class", sa.Text()),
        sa.Column("notes", sa.Text()),
        sa.UniqueConstraint("category", "distance_m", "boat_class", name="uq_event_class"),
    )

    op.create_table(
        "division",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("regatta_id", sa.Uuid(as_uuid=True), sa.ForeignKey("regatta.id"), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.UniqueConstraint("regatta_id", "name", name="uq_division_regatta_name"),
    )

    op.create_table(
        "race",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("regatta_id", sa.Uuid(as_uuid=True), sa.ForeignKey("regatta.id"), nullable=False),
        sa.Column("race_number", sa.Integer(), nullable=False),
        sa.Column("race_name", sa.Text()),
        sa.Column("round_name", sa.Text()),
        sa.Column("race_date", sa.Date()),
        sa.Column("scheduled_time_local", sa.Time()),
        sa.Column("actual_time_local", sa.Time()),
        sa.Column("event_class_id", sa.Uuid(as_uuid=True), sa.ForeignKey("event_class.id")),
        sa.Column("division_id", sa.Uuid(as_uuid=True), sa.ForeignKey("division.id")),
        sa.Column("page_number", sa.Integer()),
        sa.UniqueConstraint("regatta_id", "race_number", name="uq_race_regatta_number"),
    )

    op.create_table(
        "team",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("canonical_name", sa.Text(), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "team_alias",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("team_id", sa.Uuid(as_uuid=True), sa.ForeignKey("team.id"), nullable=False),
        sa.Column("alias_text", sa.Text(), nullable=False),
        sa.UniqueConstraint("team_id", "alias_text", name="uq_team_alias_team_text"),
    )
    op.create_index("ix_team_alias_alias_text", "team_alias", ["alias_text"])

    op.create_table(
        "race_entry",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("race_id", sa.Uuid(as_uuid=True), sa.ForeignKey("race.id"), nullable=False),
        sa.Column("lane", sa.Integer()),
        sa.Column("seed_code", sa.Text()),
        sa.Column("team_id", sa.Uuid(as_uuid=True), sa.ForeignKey("team.id")),
        sa.Column("raw_team_text", sa.Text(), nullable=False),
        sa.Column("place", sa.Integer()),
        sa.Column("time_display", sa.Text()),
        sa.Column("time_ms", sa.Integer()),
        sa.Column("status", sa.Text(), nullable=False, server_default="UNKNOWN"),
        sa.Column("rank", sa.Integer()),
    )
    op.create_index("ix_race_entry_race_id", "race_entry", ["race_id"])
    op.create_index("ix_race_entry_team_id", "race_entry", ["team_id"])
    op.create_index(
        "uq_race_entry_race_lane",
        "race_entry",
        ["race_id", "lane"],
        unique=True,
        postgresql_where=sa.text("lane IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_race_entry_race_lane", table_name="race_entry")
    op.drop_index("ix_race_entry_team_id", table_name="race_entry")
    op.drop_index("ix_race_entry_race_id", table_name="race_entry")
    op.drop_table("race_entry")

    op.drop_index("ix_team_alias_alias_text", table_name="team_alias")
    op.drop_table("team_alias")

    op.drop_table("team")
    op.drop_table("race")
    op.drop_table("division")
    op.drop_table("event_class")

    op.drop_index("ix_raw_race_row_race_number", table_name="raw_race_row")
    op.drop_index("ix_raw_race_row_import_file_id", table_name="raw_race_row")
    op.drop_table("raw_race_row")

    op.drop_table("import_file")
    op.drop_table("regatta")
