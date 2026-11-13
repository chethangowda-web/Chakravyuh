from datetime import UTC, datetime
from typing import Any

from sqlalchemy import JSON, Column


def utcnow() -> datetime:
    return datetime.now(UTC)


def json_column() -> Any:
    """A JSON column (lists / dicts) for SQLModel `sa_column=`."""
    return Column(JSON, nullable=False)


def nullable_json_column() -> Any:
    return Column(JSON, nullable=True)
