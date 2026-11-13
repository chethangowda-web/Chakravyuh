"""Voice red-team contracts."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import StrictModel
from app.schemas.enums import AttackCategory, AudioSource, LanguageCode, Verdict
from app.schemas.result import ResultDetail

MAX_AUDIO_SECONDS = 25
MAX_AUDIO_BYTES = 2 * 1024 * 1024


class SynthesizeRequest(StrictModel):
    text: str = Field(min_length=1, max_length=2500)
    language: LanguageCode
    speaker: str | None = Field(default=None, max_length=64)


class AudioAssetOut(StrictModel):
    id: str
    source: AudioSource
    language: LanguageCode | None
    text: str | None
    duration_s: float | None
    url: str
    created_at: datetime


class VoiceTestRequest(StrictModel):
    audio_id: str = Field(min_length=1)
    target_id: int
    category: AttackCategory
    language: LanguageCode | None = Field(
        default=None, description="Spoken language; null lets Sarvam STT auto-detect"
    )
    intended_text: str | None = Field(
        default=None, max_length=2500, description="What the attacker meant to say (for drift)"
    )
    code_mixed: bool = False


class VoiceReplayRequest(StrictModel):
    max_attacks: int = Field(default=10, ge=2, le=30)


class VoicePair(StrictModel):
    """The SAME attack sent as text and as speech."""

    language: LanguageCode
    category: AttackCategory
    text_result_id: int
    voice_result_id: int
    text_verdict: Verdict
    voice_verdict: Verdict
    transcript_drift: float | None


class VoiceLanguageDelta(StrictModel):
    language: LanguageCode
    pairs: int
    text_succeeded: int
    voice_succeeded: int


class VoiceComparisonOut(StrictModel):
    base_campaign_id: int
    voice_campaign_id: int
    text_baseline: Literal["fresh", "original"] = Field(
        description="'fresh' = the text version was re-sent alongside the voice one and judged identically (fair "
        "comparison); 'original' = older replay compared against the original campaign's verdicts"
    )
    pairs: int = Field(description="Attacks with a usable result in both modalities")
    text_succeeded: int
    voice_succeeded: int
    both: int
    text_only: int = Field(description="Succeeded as text, failed when spoken")
    voice_only: int = Field(description="Failed as text, succeeded when spoken")
    mean_transcript_drift: float | None
    by_language: list[VoiceLanguageDelta]
    items: list[VoicePair]


class VoiceTestResponse(StrictModel):
    transcript: str
    detected_language: str | None
    transcript_drift: float | None
    result: ResultDetail
