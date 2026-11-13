"""Adaptive-attacker (missions) and auto-fix (hardening loop) contracts."""

from datetime import datetime

from pydantic import Field

from app.schemas.common import StrictModel
from app.schemas.enums import (
    AttackCategory,
    CampaignStatus,
    Confidence,
    FixApplyMode,
    LanguageCode,
    ScriptVariant,
    Severity,
    Verdict,
)


class MissionTurn(StrictModel):
    result_id: int
    turn: int
    tactic: str | None
    variant: ScriptVariant
    attack_text: str
    english_meaning: str | None
    attacker_note: str | None = Field(description="Why the attacker chose this tactic (its reasoning)")
    reply_excerpt: str | None
    verdict: Verdict
    confidence: Confidence | None
    severity: Severity


class MissionOut(StrictModel):
    mission_id: str
    category: AttackCategory
    language: LanguageCode
    goal: str
    breached: bool
    turns_used: int
    winning_tactic: str | None
    turns: list[MissionTurn]


class MissionList(StrictModel):
    items: list[MissionOut]
    breached: int
    total: int


class HelpfulnessItem(StrictModel):
    language: LanguageCode
    question: str
    reply_excerpt: str | None
    answered: bool | None = Field(description="null when the target errored")
    rationale: str | None


class HelpfulnessLanguageStat(StrictModel):
    language: LanguageCode
    total: int
    answered: int


class HelpfulnessOut(StrictModel):
    """Over-refusal check: how many legitimate banking questions the bot still answers."""

    id: int
    phase: str = Field(description="'before' or 'after' the fix")
    status: CampaignStatus
    total: int
    answered: int
    errors: int
    answer_rate: float | None = Field(description="answered / (total - errors); null until finished")
    by_language: list[HelpfulnessLanguageStat]
    items: list[HelpfulnessItem]


class FixProposalOut(StrictModel):
    id: int
    campaign_id: int
    target_id: int
    summary: str
    changes: list[str]
    revised_prompt: str | None
    addendum: str | None
    previous_prompt: str | None
    failures_considered: int
    fix_set_size: int = Field(description="Successful attacks shown to the patch author")
    heldout_set_size: int = Field(description="Successful attacks held back to test generalization")
    helpfulness_before: HelpfulnessOut | None
    helpfulness_after: HelpfulnessOut | None
    applied: bool
    applied_via: FixApplyMode | None
    applied_at: datetime | None
    regression_id: int | None
    created_at: datetime


class FixList(StrictModel):
    items: list[FixProposalOut]


class FixApplyRequest(StrictModel):
    via: FixApplyMode
    trials: int = Field(default=1, ge=1, le=3)


class HardeningStep(StrictModel):
    label: str
    campaign_id: int
    regression_id: int | None
    fix_id: int | None
    status: CampaignStatus
    vulnerable: int = Field(description="Attacks that still succeed at this step")
    rerun_total: int | None = Field(description="Attacks replayed at this step (null for the original run)")


class HardeningOut(StrictModel):
    root_campaign_id: int
    latest_campaign_id: int
    steps: list[HardeningStep]
