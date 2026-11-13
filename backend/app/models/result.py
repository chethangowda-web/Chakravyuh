from datetime import datetime
from typing import Any

from sqlmodel import Field, SQLModel

from app.models._common import json_column, utcnow
from app.schemas.enums import Confidence, Severity, Verdict


class Result(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    test_case_id: int = Field(foreign_key="testcase.id", index=True)
    campaign_id: int = Field(foreign_key="campaign.id", index=True)  # denormalized for fast filters
    trial: int = 1
    http_status: int | None = None
    raw_response: str = ""  # truncated to 20 KB
    extracted_reply: str | None = None
    latency_ms: int | None = None
    detector_hits: list[dict[str, Any]] = Field(default_factory=list, sa_column=json_column())
    verdict: Verdict
    confidence: Confidence | None = None
    severity: Severity = Severity.NONE
    judge_rationale: str | None = None
    created_at: datetime = Field(default_factory=utcnow)
