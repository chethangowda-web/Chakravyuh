"""Regression testing contracts."""

from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import StrictModel
from app.schemas.enums import (
    AttackCategory,
    CampaignStatus,
    LanguageCode,
    RegressionOutcome,
    ScriptVariant,
    Severity,
)


class RegressionCreate(StrictModel):
    only_failed: bool = True
    trials: int = Field(default=3, ge=1, le=3)


class RegressionCaseOut(StrictModel):
    base_test_case_id: int
    category: AttackCategory
    language: LanguageCode
    variant: ScriptVariant
    attack_text: str
    before_severity: Severity
    after_severity: Severity | None  # null until the rerun finishes
    vulnerable_trials: int
    trials: int
    outcome: RegressionOutcome | None
    split: Literal["fix", "heldout"] | None = Field(
        description="'fix' = shown to the patch author; 'heldout' = never seen by it; null = not part of the fix"
    )


class GeneralizationOut(StrictModel):
    """Did the patch fix only the attacks it was shown, or also ones it never saw?"""

    fix_set_total: int
    fix_set_still_vulnerable: int
    heldout_total: int
    heldout_still_vulnerable: int
    complete: bool


class RegressionSummary(StrictModel):
    fixed: int = 0
    still_vulnerable: int = 0
    flaky: int = 0
    new_vulnerability: int = 0


class RegressionOut(StrictModel):
    id: int
    base_campaign_id: int
    new_campaign_id: int
    status: CampaignStatus
    trials: int
    only_failed: bool
    summary: RegressionSummary
    cases: list[RegressionCaseOut]
    fix_id: int | None = Field(description="The auto-fix proposal this rerun verifies, if any")
    fix_summary: str | None
    generalization: GeneralizationOut | None
    created_at: datetime
