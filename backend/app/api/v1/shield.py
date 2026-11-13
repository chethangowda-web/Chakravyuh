"""Chakravyuh Shield: runtime protection in front of a verified target."""

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.db import get_session
from app.schemas.shield import (
    FalseBlockRequest,
    FalseBlockResult,
    ShieldChatRequest,
    ShieldChatResponse,
    ShieldOverview,
)
from app.schemas.target import TargetOut
from app.services import mappers, shield

router = APIRouter(prefix="/shield", tags=["shield"])


@router.post("/{target_id}/chat", operation_id="shieldChat")
async def shield_chat(target_id: int, body: ShieldChatRequest, session: Session = Depends(get_session)) -> ShieldChatResponse:
    """Send a message to the protected target through Shield. Point your app's users (or a campaign) here."""
    r = await shield.handle(session, target_id, body.message)
    return ShieldChatResponse(reply=r.reply, action=r.action, reason=r.reason, language=r.language, script=r.script,  # type: ignore[arg-type]
                              english=r.english, rule=r.rule, category=r.category, latency_ms=r.latency_ms)


@router.post("/{target_id}/protect", status_code=status.HTTP_201_CREATED, operation_id="protectTarget")
def protect(target_id: int, session: Session = Depends(get_session)) -> TargetOut:
    """Create (or return) the '<name> + Shield' target, which can be attacked like any other target."""
    return mappers.target_out(shield.protect(session, target_id))


@router.get("/{target_id}", operation_id="getShieldOverview")
def get_overview(target_id: int, session: Session = Depends(get_session)) -> ShieldOverview:
    """Shield stats, recent decisions, and the without-vs-with-Shield campaign comparison."""
    return shield.overview(session, target_id)


@router.post("/{target_id}/false-block-check", operation_id="runFalseBlockCheck")
async def false_block_check(
    target_id: int, body: FalseBlockRequest, session: Session = Depends(get_session)
) -> FalseBlockResult:
    """Run the target's legitimate questions through Shield's input check: are real users let through?"""
    return await shield.false_block_check(session, target_id, body.languages)
