"""POST /v1/chat/completions — sarvam-105b."""

import json
import re
from typing import Any, Literal

from app.config import get_settings
from app.integrations.sarvam.client import post_json
from app.integrations.sarvam.types import ChatCompletionResponse

# The live API (Nov 2026) accepts only low/medium/high; "off" sends an explicit JSON null,
# which the docs describe as disabling reasoning. None omits the field (server default).
ReasoningEffort = Literal["off", "low", "medium", "high"]


async def chat(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.2,
    max_tokens: int = 2048,
    reasoning_effort: ReasoningEffort | None = "low",
    json_schema: dict[str, Any] | None = None,
    schema_name: str = "result",
    cache: bool = False,
    model: str | None = None,
) -> ChatCompletionResponse:
    payload: dict[str, Any] = {
        "model": model or get_settings().sarvam_chat_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if reasoning_effort == "off":
        payload["reasoning_effort"] = None
    elif reasoning_effort is not None:
        payload["reasoning_effort"] = reasoning_effort
    if json_schema is not None:
        payload["response_format"] = {
            "type": "json_schema",
            "json_schema": {"name": schema_name, "schema": json_schema, "strict": True},
        }
    raw = await post_json("/v1/chat/completions", payload, cache=cache)
    return ChatCompletionResponse.model_validate(raw)


_JSON_OBJECT = re.compile(r"\{.*\}", re.DOTALL)


def parse_json_content(content: str) -> dict[str, Any] | None:
    """Parse a JSON object from model output, tolerating code fences / surrounding text."""
    text = content.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.split("\n", 1)[1] if "\n" in text else text
    for candidate in (text, *(m.group(0) for m in [_JSON_OBJECT.search(text)] if m)):
        try:
            value = json.loads(candidate)
        except ValueError:
            continue
        if isinstance(value, dict):
            return value
    return None
