"""POST /translate — mayura:v1 supports `mode=code-mixed` and `output_script=roman`."""

from typing import Literal

from app.config import get_settings
from app.integrations.sarvam.client import SarvamError, post_json
from app.integrations.sarvam.types import TranslateResponse

TranslateMode = Literal["formal", "modern-colloquial", "classic-colloquial", "code-mixed"]
OutputScript = Literal["roman", "fully-native", "spoken-form-in-native"]

MAX_INPUT_CHARS = 1000  # mayura:v1 limit


async def translate(
    text: str,
    *,
    source: str,
    target: str,
    mode: TranslateMode = "formal",
    output_script: OutputScript | None = None,
) -> str:
    if len(text) > MAX_INPUT_CHARS:
        raise SarvamError(422, "input_too_long", f"Translate input exceeds {MAX_INPUT_CHARS} characters")
    payload: dict[str, object] = {
        "input": text,
        "source_language_code": source,
        "target_language_code": target,
        "model": get_settings().sarvam_translate_model,
        "mode": mode,
    }
    if output_script is not None:
        payload["output_script"] = output_script
    raw = await post_json("/translate", payload, cache=True)
    return TranslateResponse.model_validate(raw).translated_text
