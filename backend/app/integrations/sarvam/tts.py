"""POST /text-to-speech — Bulbul. Returns WAV bytes."""

import base64

from app.config import get_settings
from app.integrations.sarvam.client import SarvamError, post_json
from app.integrations.sarvam.types import TtsResponse

# bulbul:v4-flash persona IDs per language (from docs.sarvam.ai TTS reference, Nov 2026).
DEFAULT_SPEAKERS: dict[str, str] = {
    "en-IN": "ishita_en_customer",
    "hi-IN": "ritu_hi_conversation",
    "kn-IN": "chetan_kn_conversation",
    "te-IN": "kavitha_te_conversation",
    "ta-IN": "vijay_ta_narration",
}
CODE_MIXED_SPEAKER = "shubh_enhi_ads"  # English-Hindi persona, also the API default
MAX_TEXT_CHARS = 2500


async def synthesize(text: str, *, language: str, speaker: str | None = None) -> bytes:
    if len(text) > MAX_TEXT_CHARS:
        raise SarvamError(422, "input_too_long", f"TTS input exceeds {MAX_TEXT_CHARS} characters")
    payload = {
        "text": text,
        "language_code": language,
        "model": get_settings().sarvam_tts_model,
        "speaker": speaker or DEFAULT_SPEAKERS.get(language, CODE_MIXED_SPEAKER),
        "speech_sample_rate": 16000,  # STT works best at 16 kHz
        "output_audio_codec": "wav",
    }
    raw = await post_json("/text-to-speech", payload, cache=True)
    parsed = TtsResponse.model_validate(raw)
    if not parsed.audios:
        raise SarvamError(502, "sarvam_empty_audio", "Sarvam TTS returned no audio")
    return base64.b64decode(parsed.audios[0])
