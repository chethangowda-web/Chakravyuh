"""Voice red team: audio (Sarvam TTS or upload) -> Sarvam STT -> target -> detectors.

This exercises the real audio -> text -> LLM path of a voice app: the attack must survive
speech recognition to reach the model, and we measure how much it drifted on the way.
"""

import io
import unicodedata
import uuid
import wave
from dataclasses import dataclass
from datetime import UTC, datetime
from difflib import SequenceMatcher

from fastapi import UploadFile
from sqlmodel import Session

from app.config import get_settings
from app.db import engine
from app.errors import AppError, not_found
from app.integrations.sarvam import stt, tts
from app.models import AudioAsset, Campaign, Result, TestCase
from app.schemas.campaign import CampaignConfig
from app.schemas.enums import AudioSource, CampaignStatus, LanguageCode, Modality, Mutation, ScriptVariant, Verdict
from app.schemas.voice import (
    MAX_AUDIO_BYTES,
    MAX_AUDIO_SECONDS,
    AudioAssetOut,
    SynthesizeRequest,
    VoiceTestRequest,
    VoiceTestResponse,
)
from app.services import mappers
from app.services.campaigns import get_target_or_404, require_verified
from app.services.detectors.base import fold
from app.services.runner import attack_and_evaluate
from app.services.target_adapter import TargetSnapshot

_EXTENSIONS = {
    "audio/wav": ".wav", "audio/x-wav": ".wav", "audio/wave": ".wav", "audio/webm": ".webm",
    "audio/ogg": ".ogg", "audio/mpeg": ".mp3", "audio/mp4": ".m4a", "audio/x-m4a": ".m4a",
}
_CATEGORY_LABEL = {
    "prompt_injection": "Prompt injection", "jailbreak": "Jailbreak", "instruction_override": "Instruction override",
    "system_prompt_extraction": "System prompt extraction", "sensitive_data_leak": "Sensitive data leak",
}


def _wav_duration(data: bytes) -> float | None:
    try:
        with wave.open(io.BytesIO(data)) as w:
            return round(w.getnframes() / float(w.getframerate()), 2)
    except (wave.Error, EOFError, ZeroDivisionError):
        return None


def _store(session: Session, data: bytes, *, source: AudioSource, content_type: str,
           language: LanguageCode | None, text: str | None) -> AudioAsset:
    audio_id = uuid.uuid4().hex
    filename = f"{audio_id}{_EXTENSIONS.get(content_type, '.bin')}"
    (get_settings().audio_dir / filename).write_bytes(data)
    asset = AudioAsset(id=audio_id, source=source, language=language, text=text, filename=filename,
                       content_type=content_type, duration_s=_wav_duration(data))
    session.add(asset)
    session.commit()
    session.refresh(asset)
    return asset


async def synthesize(session: Session, body: SynthesizeRequest) -> AudioAssetOut:
    audio = await tts.synthesize(body.text, language=body.language.value, speaker=body.speaker)
    asset = _store(session, audio, source=AudioSource.TTS, content_type="audio/wav",
                   language=body.language, text=body.text)
    return mappers.audio_out(asset)


async def upload(session: Session, file: UploadFile, language: LanguageCode | None) -> AudioAssetOut:
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type not in _EXTENSIONS:
        raise AppError(415, "unsupported_audio", f"Unsupported audio type '{content_type}'. Use WAV, WebM, OGG, MP3 or M4A.")
    data = await file.read(MAX_AUDIO_BYTES + 1)
    if len(data) > MAX_AUDIO_BYTES:
        raise AppError(413, "audio_too_large", f"Audio must be at most {MAX_AUDIO_BYTES // (1024 * 1024)} MB.")
    if not data:
        raise AppError(422, "empty_audio", "The uploaded file is empty.")
    duration = _wav_duration(data)
    if duration is not None and duration > MAX_AUDIO_SECONDS:
        raise AppError(413, "audio_too_long", f"Audio must be at most {MAX_AUDIO_SECONDS} seconds (got {duration:.0f}s).")
    asset = _store(session, data, source=AudioSource.UPLOAD, content_type=content_type, language=language, text=None)
    return mappers.audio_out(asset)


@dataclass
class SpokenAttack:
    audio_id: str
    transcript: str
    detected_language: str | None
    drift: float | None


async def speak_and_transcribe(text: str, language: LanguageCode, *, code_mixed: bool) -> SpokenAttack:
    """Sarvam TTS speaks the attack, Sarvam STT hears it back: exactly what a voice bot's pipeline does.
    Raises SarvamError if either step fails."""
    audio = await tts.synthesize(text[: tts.MAX_TEXT_CHARS], language=language.value)
    with Session(engine) as session:
        asset = _store(session, audio, source=AudioSource.TTS, content_type="audio/wav", language=language, text=text)
        audio_id, filename = asset.id, asset.filename
    heard = await stt.transcribe(audio, filename=filename, content_type="audio/wav", language=language.value,
                                 code_mixed=code_mixed)
    transcript = heard.transcript.strip()
    return SpokenAttack(audio_id, transcript, heard.language_code, _drift(text, transcript))


def get_asset(session: Session, audio_id: str) -> AudioAsset:
    asset = session.get(AudioAsset, audio_id)
    if asset is None:
        raise not_found("Audio", audio_id)
    return asset


def _latin_share(text: str) -> float:
    letters = [ch for ch in text if ch.isalpha()]
    if not letters:
        return 0.0
    return sum(1 for ch in letters if "LATIN" in unicodedata.name(ch, "")) / len(letters)


def _drift(intended: str | None, heard: str) -> float | None:
    """How far the transcript moved from the intended text (0 = identical, 1 = unrelated).

    Returns None when the two are written in different scripts (e.g. romanized Hindi typed,
    Devanagari transcribed): character similarity would then measure the script, not the speech.
    """
    if not intended:
        return None
    if abs(_latin_share(intended) - _latin_share(heard)) > 0.5:
        return None
    return round(1 - SequenceMatcher(None, fold(intended), fold(heard)).ratio(), 3)


def _language(value: str | None, fallback: LanguageCode | None) -> LanguageCode:
    if fallback is not None:
        return fallback
    try:
        return LanguageCode(value) if value else LanguageCode.EN
    except ValueError:
        return LanguageCode.EN


async def run_test(session: Session, body: VoiceTestRequest) -> VoiceTestResponse:
    target = get_target_or_404(session, body.target_id)
    require_verified(target)
    asset = get_asset(session, body.audio_id)
    audio = (get_settings().audio_dir / asset.filename).read_bytes()

    heard = await stt.transcribe(
        audio, filename=asset.filename, content_type=asset.content_type,
        language=body.language.value if body.language else None, code_mixed=body.code_mixed,
    )
    transcript = heard.transcript.strip()
    if not transcript:
        raise AppError(422, "empty_transcript", "Sarvam STT heard no speech in this audio.")
    language = _language(heard.language_code, body.language)
    intended = body.intended_text or asset.text

    campaign = Campaign(
        target_id=target.id or 0,
        name=f"Voice · {_CATEGORY_LABEL.get(body.category.value, body.category.value)} · {language.value}",
        config=CampaignConfig(categories=[body.category], languages=[language],
                              variants=[ScriptVariant.CODE_MIXED if body.code_mixed else ScriptVariant.NATIVE],
                              max_cases=1).model_dump(mode="json"),
        status=CampaignStatus.RUNNING, total_cases=1, started_at=datetime.now(UTC),
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    assert campaign.id is not None

    tc = TestCase(
        campaign_id=campaign.id, template_id="voice-lab", category=body.category, technique="Spoken attack",
        language=language, variant=ScriptVariant.CODE_MIXED if body.code_mixed else ScriptVariant.NATIVE,
        mutation_chain=[Mutation.TTS.value] if asset.source is AudioSource.TTS else [],
        attack_text=transcript, english_gloss=intended, detected_language=heard.language_code,
        modality=Modality.VOICE, audio_id=asset.id, transcript=transcript,
        transcript_drift=_drift(intended, transcript),
    )
    session.add(tc)
    session.commit()
    session.refresh(tc)

    try:
        result = await attack_and_evaluate(TargetSnapshot.of(target), tc, trial=1, use_judge=True,
                                           attacker_goal=intended or transcript)
    except AppError as exc:
        result = Result(test_case_id=tc.id or 0, campaign_id=campaign.id, verdict=Verdict.ERROR,
                        judge_rationale=exc.message)
    session.add(result)
    campaign.status = CampaignStatus.COMPLETED
    campaign.completed_cases = 1
    campaign.finished_at = datetime.now(UTC)
    session.add(campaign)
    session.commit()
    session.refresh(result)
    session.refresh(tc)

    return VoiceTestResponse(
        transcript=transcript, detected_language=heard.language_code,
        transcript_drift=tc.transcript_drift, result=mappers.result_detail(result, tc),
    )
