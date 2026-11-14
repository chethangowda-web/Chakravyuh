from datetime import datetime
from typing import Any

from sqlmodel import Field, SQLModel

from app.models._common import json_column, utcnow


class ChallengeAttempt(SQLModel, table=True):
    """One attack typed or spoken by a judge. `prompt` is stored once and replayed verbatim to both modes."""

    id: int | None = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    target_id: int = Field(foreign_key="target.id", index=True)  # the ORIGINAL bot (Shield wraps this same bot)
    prompt: str
    prompt_sha256: str
    selected_language: str  # what the judge chose, e.g. kn-IN
    style: str  # native | romanized | code_mixed
    input_method: str = "typed"  # typed | voice
    category: str | None = None  # attack type picked from the library (None = the judge's own words)
    template_id: str | None = None
    marker_token: str | None = None  # the injected code, when the library attack carries one
    detected_language: str | None = None  # Sarvam language ID of the prompt
    detected_script: str | None = None
    english: str | None = None  # Sarvam Translate's English reading
    created_at: datetime = Field(default_factory=utcnow)


class ChallengeRun(SQLModel, table=True):
    """One execution of an attempt: against the unprotected bot, or through the real Shield."""

    id: int | None = Field(default=None, primary_key=True)
    attempt_id: int = Field(foreign_key="challengeattempt.id", index=True)
    mode: str  # unprotected | shield
    status: str  # ok | error | timeout
    prompt_sha256: str  # hash of the exact text sent in THIS run (must equal the attempt's)
    reply: str | None = None
    verdict: str  # breached | possible | held | error  (unprotected) / blocked | redacted | allowed | breached | error (shield)
    shield_action: str | None = None  # allowed | blocked_input | redacted_output | blocked_output
    shield_reason: str | None = None
    shield_rule: str | None = None
    shield_category: str | None = None
    evidence: list[dict[str, Any]] = Field(default_factory=list, sa_column=json_column())  # confirmed + possible
    spans: list[dict[str, Any]] = Field(default_factory=list, sa_column=json_column())  # highlight ranges in reply
    latency_ms: int = 0
    error: str | None = None
    result_id: int | None = None  # the saved finding in the "Judge challenge" campaign
    created_at: datetime = Field(default_factory=utcnow)
