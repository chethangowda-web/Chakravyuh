"""Campaign contracts."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import SeverityCounts, StrictModel
from app.schemas.enums import (
    AttackCategory,
    AttackMode,
    AttackWrapper,
    CampaignStatus,
    LanguageCode,
    ScriptVariant,
    Severity,
    Verdict,
)


class CampaignConfig(StrictModel):
    mode: AttackMode = AttackMode.STATIC
    max_turns: int = Field(
        default=4, ge=1, le=6, description="Adaptive mode: attempts per mission before giving up"
    )
    categories: list[AttackCategory] = Field(min_length=1)
    languages: list[LanguageCode] = Field(min_length=1)
    variants: list[ScriptVariant] = Field(min_length=1)
    wrappers: list[AttackWrapper] = Field(default_factory=list)
    use_judge: bool = True
    max_cases: int = Field(default=300, ge=1, le=300)


class CampaignCreate(StrictModel):
    target_id: int
    name: str = Field(min_length=1, max_length=120)
    config: CampaignConfig


class CampaignEstimateRequest(StrictModel):
    target_id: int
    config: CampaignConfig


class CampaignEstimateResponse(StrictModel):
    total_cases: int
    estimated_target_calls: int
    estimated_sarvam_calls: int
    capped: bool
    warnings: list[str]


class CampaignCounts(StrictModel):
    vulnerable: int = 0
    safe: int = 0
    inconclusive: int = 0
    errors: int = 0
    by_severity: SeverityCounts = Field(default_factory=SeverityCounts)


class CampaignOut(StrictModel):
    id: int
    name: str
    target_id: int
    target_name: str
    config: CampaignConfig
    status: CampaignStatus
    total_cases: int
    completed_cases: int
    progress: float = Field(ge=0, le=1)
    counts: CampaignCounts
    parent_campaign_id: int | None
    regression_id: int | None = Field(description="Set when this campaign is a regression rerun")
    latest_regression_id: int | None = Field(description="Most recent regression run of this campaign")
    error_message: str | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class CampaignList(StrictModel):
    items: list[CampaignOut]


class LiveEvent(StrictModel):
    """One attack in the live feed: written (and translated), then answered and judged."""

    test_case_id: int
    result_id: int | None
    turn: int | None
    language: LanguageCode
    variant: ScriptVariant
    category: AttackCategory
    attack_excerpt: str
    stage: Literal["attacking", "done"]
    verdict: Verdict | None
    severity: Severity | None
    decided_by: Literal["rules", "judge"] | None
    created_at: datetime


class CampaignLiveOut(StrictModel):
    """Per-stage counts for the live pipeline view. Attacks run in parallel, so each count is
    'how many attacks have reached this step' rather than a single global phase."""

    status: CampaignStatus
    mode: AttackMode
    planned: int = Field(description="Attacks (or adaptive missions) planned")
    written: int = Field(description="Attack texts produced: translated by Sarvam and language-checked")
    in_flight: int = Field(description="Sent to the target, waiting for the reply or the verdict")
    analysed: int = Field(description="Replies with a verdict")
    decided_by_rules: int
    decided_by_judge: int
    vulnerable: int
    safe: int
    errors: int
    recent: list[LiveEvent]
