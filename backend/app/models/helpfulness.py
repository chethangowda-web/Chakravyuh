from datetime import datetime
from typing import Any

from sqlmodel import Field, SQLModel

from app.models._common import json_column, utcnow
from app.schemas.enums import CampaignStatus


class HelpfulnessRun(SQLModel, table=True):
    """Over-refusal check: legitimate banking questions sent to the target, before or after a fix.
    A patch that blocks attacks by refusing everything is a failed patch; this measures that."""

    id: int | None = Field(default=None, primary_key=True)
    target_id: int = Field(foreign_key="target.id", index=True)
    fix_id: int | None = Field(default=None, foreign_key="fixproposal.id", index=True)
    phase: str  # "before" | "after"
    status: CampaignStatus = CampaignStatus.QUEUED
    total: int = 0
    answered: int = 0
    errors: int = 0
    # [{language, question, reply, answered, rationale}]
    items: list[dict[str, Any]] = Field(default_factory=list, sa_column=json_column())
    created_at: datetime = Field(default_factory=utcnow)
    finished_at: datetime | None = None
