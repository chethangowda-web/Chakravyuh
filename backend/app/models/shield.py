from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models._common import utcnow


class ShieldEvent(SQLModel, table=True):
    """One message that passed through Chakravyuh Shield, and what Shield did with it."""

    id: int | None = Field(default=None, primary_key=True)
    target_id: int = Field(foreign_key="target.id", index=True)  # the protected (original) target
    created_at: datetime = Field(default_factory=utcnow)
    language: str | None = None  # Sarvam language ID, e.g. kn-IN
    script: str | None = None  # e.g. Knda, Latn
    action: str  # allowed | blocked_input | redacted_output | blocked_output
    reason: str | None = None
    rule: str | None = None  # which input rule fired, if any
    category: str | None = None  # classifier's attack category, if any
    message_excerpt: str = ""
    english_excerpt: str | None = None
    latency_ms: int = 0
