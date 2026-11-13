from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models._common import json_column, nullable_json_column, utcnow


class FixProposal(SQLModel, table=True):
    """A Sarvam-generated patch for a target's system prompt, based on one campaign's findings."""

    id: int | None = Field(default=None, primary_key=True)
    campaign_id: int = Field(foreign_key="campaign.id", index=True)
    target_id: int = Field(foreign_key="target.id", index=True)
    summary: str
    changes: list[str] = Field(default_factory=list, sa_column=json_column())
    revised_prompt: str | None = None
    addendum: str | None = None
    previous_prompt: str | None = None
    failures_considered: int = 0
    # Held-out evaluation: the patch is written from `fix_case_ids` only; `heldout_case_ids` are successful
    # attacks the patch author never saw, so the rerun measures generalization, not memorisation.
    fix_case_ids: list[int] | None = Field(default=None, sa_column=nullable_json_column())
    heldout_case_ids: list[int] | None = Field(default=None, sa_column=nullable_json_column())
    applied: bool = False
    applied_via: str | None = None
    applied_at: datetime | None = None
    regression_id: int | None = Field(default=None, foreign_key="regressionrun.id")
    created_at: datetime = Field(default_factory=utcnow)
