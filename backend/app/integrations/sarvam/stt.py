"""POST /speech-to-text (multipart). saaras:v4 by default; saaras:v3 when `mode=codemix` is needed."""

from app.config import get_settings
from app.integrations.sarvam.client import post_multipart
from app.integrations.sarvam.types import SttResponse


async def transcribe(
    audio: bytes,
    *,
    filename: str,
    content_type: str,
    language: str | None = None,
    code_mixed: bool = False,
) -> SttResponse:
    settings = get_settings()
    data: dict[str, str] = {"language_code": language or "unknown"}
    if code_mixed:
        data["model"] = settings.sarvam_stt_codemix_model
        data["mode"] = "codemix"
    else:
        data["model"] = settings.sarvam_stt_model
    raw = await post_multipart("/speech-to-text", data, {"file": (filename, audio, content_type)})
    return SttResponse.model_validate(raw)
