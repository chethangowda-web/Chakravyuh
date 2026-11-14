"""Live Judge Challenge: attack the isolated demo bot, then replay the exact same prompt through the real Shield."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlmodel import Session

from app.db import get_session
from app.errors import AppError
from app.schemas.challenge import (
    AttackRequest,
    AttemptOut,
    ProbeOut,
    ReadinessOut,
    ResetOut,
    SessionOut,
    TranscribeOut,
)
from app.schemas.enums import LanguageCode
from app.services import challenge
from app.services.voice_pipeline import _EXTENSIONS, MAX_AUDIO_BYTES

router = APIRouter(prefix="/challenge", tags=["challenge"])


@router.get("/{target_id}/readiness", operation_id="getChallengeReadiness")
async def get_readiness(target_id: int, session: Session = Depends(get_session)) -> ReadinessOut:
    """Is the demo bot reachable, verified and in its intended vulnerable state?"""
    return await challenge.readiness(session, target_id)


@router.post("/{target_id}/probe", operation_id="probeChallengeBot")
async def probe(target_id: int, session: Session = Depends(get_session)) -> ProbeOut:
    """Send one KNOWN attack to the unprotected bot and report whether it really leaks right now."""
    return await challenge.probe(session, target_id)


@router.post("/{target_id}/reset-bot", operation_id="resetChallengeBot")
async def reset_bot(target_id: int, session: Session = Depends(get_session)) -> ResetOut:
    """Put the demo bot back on v1 (an applied auto-fix leaves it on 'custom')."""
    return await challenge.reset_bot(session, target_id)


@router.post("/attack", operation_id="challengeAttack")
async def attack(body: AttackRequest, session: Session = Depends(get_session)) -> AttemptOut:
    """Step 1: store the exact prompt and attack the UNPROTECTED bot."""
    return await challenge.attack(session, body)


@router.post("/attempts/{attempt_id}/shield", operation_id="challengeActivateShield")
async def activate_shield(attempt_id: int, session: Session = Depends(get_session)) -> AttemptOut:
    """Step 2: replay the stored prompt through the real Shield."""
    return await challenge.activate_shield(session, attempt_id)


@router.post("/attempts/{attempt_id}/replay", operation_id="challengeReplay")
async def replay(attempt_id: int, session: Session = Depends(get_session)) -> AttemptOut:
    """Send the stored prompt to both modes again."""
    return await challenge.replay(session, attempt_id)


@router.get("/sessions/{session_id}", operation_id="getChallengeSession")
def get_session_attempts(session_id: str, session: Session = Depends(get_session)) -> SessionOut:
    return challenge.get_session(session, session_id)


@router.get("/recorded", operation_id="getRecordedChallenge")
def get_recorded(language: LanguageCode | None = None, session: Session = Depends(get_session)) -> AttemptOut:
    """Fallback: a real earlier run that showed the full story, always labelled source='recorded'."""
    return challenge.recorded(session, language)


@router.post("/transcribe", operation_id="challengeTranscribe")
async def transcribe(
    file: Annotated[UploadFile, File(description="WAV/WebM/OGG/MP3/M4A, at most 2 MB")],
    language: Annotated[LanguageCode | None, Form()] = None,
) -> TranscribeOut:
    """Speech to text only; nothing is attacked until the judge reviews and sends the text."""
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in _EXTENSIONS:
        raise AppError(415, "unsupported_audio", f"Unsupported audio type '{content_type}'.")
    data = await file.read(MAX_AUDIO_BYTES + 1)
    if not data:
        raise AppError(422, "empty_audio", "No audio was captured.")
    if len(data) > MAX_AUDIO_BYTES:
        raise AppError(413, "audio_too_large", f"Audio must be at most {MAX_AUDIO_BYTES // (1024 * 1024)} MB.")
    return await challenge.transcribe(data, file.filename or "speech.webm", content_type, language)
