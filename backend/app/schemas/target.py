"""Target (application under test) contracts."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import Field, field_validator

from app.schemas.common import StrictModel
from app.schemas.enums import HttpMethod, TargetKind, VerificationMethod, VerificationStatus

PROMPT_PLACEHOLDER = "{{prompt}}"


class _TargetFields(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    kind: TargetKind = TargetKind.TEXT
    base_url: str = Field(
        min_length=8,
        max_length=2048,
        pattern=r"^https?://",
        description="Full endpoint URL the attack prompt is sent to",
    )
    method: HttpMethod = HttpMethod.POST
    body_template: str = Field(
        min_length=1,
        max_length=20_000,
        description="JSON request body; must contain the `{{prompt}}` placeholder",
    )
    response_path: str = Field(
        min_length=1,
        max_length=500,
        description="Dotted path to the reply text, e.g. `choices.0.message.content`",
    )
    canary_strings: list[str] = Field(default_factory=list, max_length=20)
    system_prompt_hint: str | None = Field(default=None, max_length=20_000)
    fix_webhook_url: str | None = Field(
        default=None,
        max_length=2048,
        pattern=r"^https?://",
        description="Optional: Chakravyuh POSTs a patched system prompt here ({system_prompt, addendum}) "
        "so fixes can be applied and verified in one click",
    )
    legit_questions: list[Annotated[str, Field(max_length=500)]] = Field(
        default_factory=list,
        max_length=20,
        description="Ordinary questions a real user of this app asks (English; translated per language). "
        "Used by the over-refusal check before/after a fix. Empty = the built-in banking set",
    )

    @field_validator("body_template")
    @classmethod
    def _has_placeholder(cls, value: str) -> str:
        if PROMPT_PLACEHOLDER not in value:
            raise ValueError(f"body_template must contain {PROMPT_PLACEHOLDER}")
        return value


class TargetCreate(_TargetFields):
    headers: dict[str, str] = Field(
        default_factory=dict,
        description="Request headers (e.g. auth). Stored server-side, never returned unmasked.",
    )
    ownership_confirmed: Literal[True] = Field(
        description="User attests they own or are authorized to test this application",
    )


class TargetUpdate(_TargetFields):
    headers: dict[str, str] | None = Field(
        default=None,
        description="Omit or null to keep existing headers; provide a map to replace them",
    )


class MaskedHeader(StrictModel):
    name: str
    value_masked: str


class TargetOut(StrictModel):
    id: int
    name: str
    kind: TargetKind
    base_url: str
    method: HttpMethod
    headers: list[MaskedHeader]
    body_template: str
    response_path: str
    canary_strings: list[str]
    system_prompt_hint: str | None
    fix_webhook_url: str | None
    legit_questions: list[str]
    shield_for_target_id: int | None = Field(
        description="Set when this target is a Chakravyuh Shield in front of another target"
    )
    verification_status: VerificationStatus
    verification_token: str
    created_at: datetime


class TargetList(StrictModel):
    items: list[TargetOut]


class VerifyTargetResponse(StrictModel):
    verification_status: VerificationStatus
    method: VerificationMethod | None
    message: str


class TestConnectionRequest(StrictModel):
    prompt: str = Field(default="Hello! What can you help me with?", min_length=1, max_length=2000)


class TestConnectionResponse(StrictModel):
    ok: bool
    http_status: int | None
    latency_ms: int | None
    extracted_reply: str | None
    raw_response_preview: str
    error: str | None
