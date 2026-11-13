from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from fastapi.responses import FileResponse
from sqlmodel import Session

from app.config import get_settings
from app.db import get_session
from app.schemas.campaign import CampaignOut
from app.schemas.enums import LanguageCode
from app.schemas.voice import (
    AudioAssetOut,
    SynthesizeRequest,
    VoiceComparisonOut,
    VoiceReplayRequest,
    VoiceTestRequest,
    VoiceTestResponse,
)
from app.services import voice_pipeline, voice_replay

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/synthesize", status_code=status.HTTP_201_CREATED, operation_id="synthesizeVoice")
async def synthesize(body: SynthesizeRequest, session: Session = Depends(get_session)) -> AudioAssetOut:
    return await voice_pipeline.synthesize(session, body)


@router.post("/upload", status_code=status.HTTP_201_CREATED, operation_id="uploadVoice")
async def upload(
    file: Annotated[UploadFile, File(description="WAV/WebM/OGG/MP3/M4A, max 25 s and 2 MB")],
    language: Annotated[LanguageCode | None, Form()] = None,
    session: Session = Depends(get_session),
) -> AudioAssetOut:
    return await voice_pipeline.upload(session, file, language)


@router.post(
    "/replay/{campaign_id}", status_code=status.HTTP_201_CREATED, operation_id="startVoiceReplay"
)
async def start_voice_replay(  # async: it schedules a background task on the running event loop
    campaign_id: int, body: VoiceReplayRequest, session: Session = Depends(get_session)
) -> CampaignOut:
    """Replay a campaign's attacks as speech (Sarvam TTS -> STT -> target) for a text-vs-voice comparison."""
    return voice_replay.start(session, campaign_id, body.max_attacks)


@router.get("/replay/{campaign_id}/comparison", operation_id="getVoiceComparison")
def get_voice_comparison(campaign_id: int, session: Session = Depends(get_session)) -> VoiceComparisonOut:
    return voice_replay.compare(session, campaign_id)


@router.post("/test", operation_id="runVoiceTest")
async def run_voice_test(body: VoiceTestRequest, session: Session = Depends(get_session)) -> VoiceTestResponse:
    return await voice_pipeline.run_test(session, body)


@router.get(
    "/audio/{audio_id}",
    response_class=FileResponse,
    operation_id="getVoiceAudio",
    responses={200: {"content": {"audio/wav": {}, "audio/webm": {}, "audio/mpeg": {}}}},
)
def get_audio(audio_id: str, session: Session = Depends(get_session)) -> FileResponse:
    asset = voice_pipeline.get_asset(session, audio_id)
    return FileResponse(get_settings().audio_dir / asset.filename, media_type=asset.content_type)
