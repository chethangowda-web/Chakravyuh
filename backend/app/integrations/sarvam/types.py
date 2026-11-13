"""Typed views of the Sarvam API responses we use (verified against docs.sarvam.ai, Nov 2026).

Unknown fields are ignored so additive API changes never break us.
"""

from typing import Any

from pydantic import BaseModel, ConfigDict


class _SarvamModel(BaseModel):
    model_config = ConfigDict(extra="ignore")


class TranslateResponse(_SarvamModel):
    request_id: str | None = None
    translated_text: str
    source_language_code: str | None = None


class TextLidResponse(_SarvamModel):
    request_id: str | None = None
    language_code: str | None = None
    script_code: str | None = None


class TtsResponse(_SarvamModel):
    request_id: str | None = None
    audios: list[str]  # base64-encoded WAV


class SttResponse(_SarvamModel):
    request_id: str | None = None
    transcript: str
    language_code: str | None = None
    language_probability: float | None = None


class ChatMessage(_SarvamModel):
    role: str
    content: str | None = None
    reasoning_content: str | None = None


class ChatChoice(_SarvamModel):
    index: int = 0
    finish_reason: str | None = None
    message: ChatMessage


class ChatCompletionResponse(_SarvamModel):
    id: str | None = None
    model: str | None = None
    choices: list[ChatChoice]
    usage: dict[str, Any] | None = None

    @property
    def content(self) -> str:
        if not self.choices:
            return ""
        return self.choices[0].message.content or ""
