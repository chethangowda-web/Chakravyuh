from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models._common import utcnow


class RegressionRun(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    base_campaign_id: int = Field(foreign_key="campaign.id", index=True)
    new_campaign_id: int = Field(foreign_key="campaign.id")
    trials: int = 3
    only_failed: bool = True
    created_at: datetime = Field(default_factory=utcnow)
