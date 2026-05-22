"""Engine, sessão e dependência do FastAPI."""
from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Ex.: postgresql+psycopg://dnd:dnd@localhost:5432/dnd
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://dnd:dnd@localhost:5432/dnd",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
