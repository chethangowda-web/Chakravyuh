from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models._common import json_column, utcnow
from app.schemas.enums import HttpMethod, TargetKind, VerificationStatus


class Target(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    kind: TargetKind = TargetKind.TEXT
    base_url: str
    method: HttpMethod = HttpMethod.POST
    headers: dict[str, str] = Field(default_factory=dict, sa_column=json_column())  # secret values
    body_template: str
    response_path: str
    canary_strings: list[str] = Field(default_factory=list, sa_column=json_column())
    system_prompt_hint: str | None = None
    fix_webhook_url: str | None = None  # where Chakravyuh may push a patched system prompt
    legit_questions: list[str] | None = Field(default=None, sa_column=json_column())  # over-refusal check; None = default set
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED
    verification_token: str
    ownership_confirmed_at: datetime
    created_at: datetime = Field(default_factory=utcnow)
