from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def get_engine(db_url: str):
    if db_url.startswith("sqlite"):
        return create_engine(db_url, connect_args={"check_same_thread": False})
    return create_engine(db_url)


def get_session_factory(db_url: str):
    engine = get_engine(db_url)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
