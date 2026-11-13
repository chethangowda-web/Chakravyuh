"""POST /text-lid — language + script identification (input ≤ 1000 chars)."""

from app.integrations.sarvam.client import post_json
from app.integrations.sarvam.types import TextLidResponse


async def identify(text: str) -> TextLidResponse:
    raw = await post_json("/text-lid", {"input": text[:1000]}, cache=True)
    return TextLidResponse.model_validate(raw)
