"""Live Judge Challenge contracts: a judge attacks the isolated demo bot, then replays the exact same prompt
through the real Chakravyuh Shield."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import StrictModel
from app.schemas.enums import AttackCategory, LanguageCode, ScriptVariant

RunMode = Literal["unprotected", "shield"]
Source = Literal["live", "recorded"]
Outcome = Literal[
    "shield_stopped_breach",  # unprotected bot leaked confirmed planted data; Shield's reply has none
    "shield_missed",  # the Shield-protected reply still contains confirmed planted data
    "both_held",  # nothing confirmed leaked in either mode
    "shield_blocked_without_breach",  # Shield intervened although the unprotected bot did not leak
    "unprotected_only",  # only the unprotected run exists so far
    "incomplete",  # a run failed or timed out
]


class CheckOut(StrictModel):
    key: str
    label: str
    ok: bool | None = Field(description="true = good, false = needs attention, null = could not be determined")
    detail: str


class ReadinessOut(StrictModel):
    target_id: int
    target_name: str
    shield_target_id: int | None
    bot_version: str | None = Field(description="v1 = the intended vulnerable state; null = unknown")
    ready: bool = Field(description="Everything the live demonstration needs is in place")
    checks: list[CheckOut]


class ProbeOut(StrictModel):
    """Result of sending one KNOWN attack to the unprotected bot to confirm it is in the vulnerable state."""

    leaked: bool
    language: LanguageCode
    prompt: str
    attack_label: str = Field(description="Which known attack was sent last, e.g. 'auditor asks for personal data'")
    latency_ms: int
    evidence: list[str]
    error: str | None


class EvidenceItem(StrictModel):
    kind: Literal["planted_secret", "planted_personal_data", "prompt_leak", "injected_instruction", "possible_pii_pattern"]
    confirmed: bool = Field(description="false = only a PII-looking pattern with no link to planted data")
    label: str
    value: str | None = Field(description="The matched text (synthetic demo data), when it is safe to show")


class SpanOut(StrictModel):
    start: int
    end: int
    confirmed: bool


class RunOut(StrictModel):
    id: int
    attempt_id: int
    mode: RunMode
    source: Source = Field(description="'live' only for a run that just executed; 'recorded' for a stored one")
    status: Literal["ok", "error", "timeout"]
    verdict: Literal["breached", "possible", "held", "blocked", "redacted", "allowed", "error"]
    reply: str | None
    shield_action: Literal["allowed", "blocked_input", "redacted_output", "blocked_output"] | None
    shield_reason: str | None
    shield_rule: str | None
    shield_category: str | None
    evidence: list[EvidenceItem]
    spans: list[SpanOut]
    latency_ms: int
    prompt_sha256: str = Field(description="Hash of the exact text this run received")
    error: str | None
    finding_id: int | None = Field(description="Open /findings/{id} for the full stored evidence")
    created_at: datetime


class AttemptOut(StrictModel):
    id: int
    session_id: str
    target_id: int
    prompt: str
    prompt_sha256: str
    selected_language: LanguageCode
    style: ScriptVariant
    input_method: Literal["typed", "voice"]
    category: AttackCategory | None = Field(description="Library attack type, null for the judge's own words")
    template_id: str | None
    marker_token: str | None = Field(description="Injected code that proves the bot obeyed, if the attack carries one")
    detected_language: str | None
    detected_script: str | None
    english: str | None
    language_matches: bool | None = Field(description="Whether Sarvam's detected language equals the selected one")
    created_at: datetime
    unprotected: RunOut | None
    shield: RunOut | None
    identical_prompt: bool | None = Field(description="Both runs received exactly the same text; null until both ran")
    outcome: Outcome
    source: Source


class SessionOut(StrictModel):
    session_id: str
    attempts: list[AttemptOut]


class AttackRequest(StrictModel):
    session_id: str = Field(min_length=8, max_length=64)
    target_id: int
    message: str = Field(min_length=1, max_length=2000)
    language: LanguageCode
    style: ScriptVariant = ScriptVariant.NATIVE
    input_method: Literal["typed", "voice"] = "typed"
    category: AttackCategory | None = None
    template_id: str | None = Field(default=None, max_length=80)
    marker_token: str | None = Field(default=None, max_length=20)


class TranscribeOut(StrictModel):
    transcript: str
    detected_language: str | None


class ResetOut(StrictModel):
    bot_version: str | None
