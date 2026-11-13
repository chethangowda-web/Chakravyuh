from datetime import datetime
from typing import Any

from sqlmodel import Field, SQLModel

from app.models._common import json_column, utcnow


class SarvamCache(SQLModel, table=True):
    """Caches deterministic-enough Sarvam responses (translate, text-lid, tts) to save credits."""

    key: str = Field(primary_key=True)  # sha256(endpoint + canonical payload)
    endpoint: str
    response: dict[str, Any] = Field(sa_column=json_column())
    created_at: datetime = Field(default_factory=utcnow)
