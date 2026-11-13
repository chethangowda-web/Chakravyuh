"""Test result / finding contracts."""

from datetime import datetime

from pydantic import Field

from app.schemas.common import StrictModel
from app.schemas.enums import (
    AttackCategory,
    Confidence,
    DetectorName,
    LanguageCode,
    Modality,
    Mutation,
    ScriptVariant,
    Severity,
    Verdict,
)


class TextSpan(StrictModel):
    """Character offsets into `extracted_reply` to highlight as evidence."""

    start: int = Field(ge=0)
    end: int = Field(ge=0)


class DetectorHit(StrictModel):
    detector: DetectorName
    fired: bool
    score: float | None
    evidence: str | None
    spans: list[TextSpan]


class ResultSummary(StrictModel):
    id: int
    campaign_id: int
    test_case_id: int
    trial: int
    category: AttackCategory
    language: LanguageCode
    variant: ScriptVariant
    modality: Modality
    attack_text: str
    verdict: Verdict
    confidence: Confidence | None
    severity: Severity
    latency_ms: int | None
    mission_id: str | None
    turn: int | None
    tactic: str | None
    created_at: datetime


class ResultPage(StrictModel):
    items: list[ResultSummary]
    total: int
    offset: int
    limit: int


class ResultDetail(ResultSummary):
    technique: str
    mutation_chain: list[Mutation]
    english_gloss: str | None
    detected_language: str | None
    detected_script: str | None
    marker_token: str | None
    http_status: int | None
    raw_response: str
    extracted_reply: str | None
    detector_hits: list[DetectorHit]
    judge_rationale: str | None
    attacker_note: str | None
    remediation: str | None
    audio_id: str | None
    transcript: str | None
    transcript_drift: float | None
