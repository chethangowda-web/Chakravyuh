"""Manual testing for the Chakravyuh browser extension (verified targets only)."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.db import get_session
from app.schemas.manual import (
    ManualAttackOut,
    ManualAttackRequest,
    ManualCheckOut,
    ManualCheckRequest,
    ManualMatchOut,
)
from app.services import manual

router = APIRouter(prefix="/manual", tags=["manual"])


@router.get("/match", operation_id="matchManualTarget")
def match(url: Annotated[str, Query(min_length=1, max_length=2048)], session: Session = Depends(get_session)) -> ManualMatchOut:
    """Find the verified target whose origin matches the page the extension is open on."""
    return manual.match(session, url)


@router.post("/attack", operation_id="prepareManualAttack")
async def prepare_attack(body: ManualAttackRequest, session: Session = Depends(get_session)) -> ManualAttackOut:
    """Prepare one attack (translated, with a fresh hidden code) for the person to send in their own chat."""
    return await manual.prepare(session, body)


@router.post("/check", operation_id="checkManualReply")
async def check_reply(body: ManualCheckRequest, session: Session = Depends(get_session)) -> ManualCheckOut:
    """Score the bot's reply with the same detectors as campaigns and save it as a finding."""
    return await manual.check(session, body)
