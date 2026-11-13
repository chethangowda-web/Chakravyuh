"""Chakravyuh Shield contracts: the runtime guard in front of a chatbot."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import StrictModel
from app.schemas.dashboard import LanguageStat
from app.schemas.enums import LanguageCode
from app.schemas.target import TargetOut

ShieldAction = Literal["allowed", "blocked_input", "redacted_output", "blocked_output"]


class ShieldChatRequest(StrictModel):
    message: str = Field(min_length=1, max_length=8000)


class ShieldChatResponse(StrictModel):
    """`reply` is what the user sees: the bot's answer, a redacted answer, or a polite refusal."""

    reply: str
    action: ShieldAction
    reason: str | None
    language: str | None = Field(description="Detected by Sarvam language ID, e.g. kn-IN")
    script: str | None
    english: str | None = Field(description="Sarvam Translate's English reading of the message")
    rule: str | None = Field(description="Fast input rule that fired, if any")
    category: str | None = Field(description="Attack category from the Sarvam-105B classifier, if any")
    latency_ms: int


class ShieldEventOut(StrictModel):
    id: int
    created_at: datetime
    language: str | None
    script: str | None
    action: ShieldAction
    reason: str | None
    rule: str | None
    category: str | None
    message_excerpt: str
    english_excerpt: str | None
    latency_ms: int


class ShieldLanguageStat(StrictModel):
    language: str
    checked: int
    blocked: int = Field(description="Inputs blocked + replies blocked or redacted")


class ShieldStats(StrictModel):
    checked: int
    allowed: int
    blocked_input: int
    redacted_output: int
    blocked_output: int
    by_language: list[ShieldLanguageStat]


class ShieldComparison(StrictModel):
    """Latest campaign against the bare target vs the latest one against the shielded target."""

    without_campaign_id: int | None
    with_campaign_id: int | None
    same_config: bool = Field(description="Both campaigns used the same mode, categories, languages and styles")
    without_rate: float | None
    with_rate: float | None
    without_by_language: list[LanguageStat]
    with_by_language: list[LanguageStat]


class ShieldOverview(StrictModel):
    target: TargetOut
    shield_target: TargetOut | None = Field(description="The '<name> + Shield' target, once created")
    stats: ShieldStats
    recent: list[ShieldEventOut]
    comparison: ShieldComparison


class FalseBlockRequest(StrictModel):
    languages: list[LanguageCode] = Field(
        default_factory=lambda: [LanguageCode.EN, LanguageCode.HI, LanguageCode.KN], min_length=1, max_length=5
    )


class FalseBlockItem(StrictModel):
    language: LanguageCode
    question: str = Field(description="The English question")
    text: str = Field(description="What was sent through Shield (translated)")
    reason: str | None


class FalseBlockResult(StrictModel):
    """Legitimate questions sent through Shield's input check: how many got through?"""

    total: int
    allowed: int
    blocked: list[FalseBlockItem]
