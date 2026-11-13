from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models._common import utcnow
from app.schemas.enums import AudioSource, LanguageCode


class AudioAsset(SQLModel, table=True):
    id: str = Field(primary_key=True)  # uuid4 hex
    source: AudioSource
    language: LanguageCode | None = None
    text: str | None = None
    filename: str  # relative to settings.audio_dir
    content_type: str
    duration_s: float | None = None
    created_at: datetime = Field(default_factory=utcnow)
