from datetime import datetime
from typing import Any

from sqlmodel import Field, SQLModel

from app.models._common import json_column, utcnow
from app.schemas.enums import CampaignStatus


class Campaign(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    target_id: int = Field(foreign_key="target.id", index=True)
    name: str
    config: dict[str, Any] = Field(sa_column=json_column())  # CampaignConfig.model_dump()
    status: CampaignStatus = CampaignStatus.QUEUED
    total_cases: int = 0
    completed_cases: int = 0
    parent_campaign_id: int | None = Field(default=None, foreign_key="campaign.id")
    error_message: str | None = None
    created_at: datetime = Field(default_factory=utcnow)
    started_at: datetime | None = None
    finished_at: datetime | None = None
