"""Sends a prompt to a user-configured target using its request template and extracts the reply."""

import json
import time
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.config import get_settings
from app.errors import AppError
from app.models.target import Target
from app.schemas.target import PROMPT_PLACEHOLDER
from app.services import net_guard

USER_AGENT = "Chakravyuh/0.1 (authorized LLM red-team testing)"


@dataclass(frozen=True)
class TargetSnapshot:
    """Detached, immutable copy of a target used by background tasks."""

    id: int
    name: str
    base_url: str
    method: str
    headers: dict[str, str]
    body_template: str
    response_path: str
    canary_strings: list[str]
    system_prompt_hint: str | None

    @classmethod
    def of(cls, target: Target) -> "TargetSnapshot":
        assert target.id is not None
        return cls(
            id=target.id,
            name=target.name,
            base_url=target.base_url,
            method=str(target.method.value if hasattr(target.method, "value") else target.method),
            headers=dict(target.headers),
            body_template=target.body_template,
            response_path=target.response_path,
            canary_strings=list(target.canary_strings),
            system_prompt_hint=target.system_prompt_hint,
        )


@dataclass
class TargetResponse:
    ok: bool
    http_status: int | None
    latency_ms: int | None
    raw_text: str
    extracted: str | None
    error: str | None = None
    truncated: bool = False
    extra: dict[str, Any] = field(default_factory=dict)


def render_body(template: str, prompt: str) -> Any:
    """Insert the prompt (JSON-escaped) into the template and parse it as JSON."""
    escaped = json.dumps(prompt, ensure_ascii=False)[1:-1]
    rendered = template.replace(PROMPT_PLACEHOLDER, escaped)
    try:
        return json.loads(rendered)
    except ValueError as exc:
        raise AppError(
            422,
            "invalid_body_template",
            "body_template must be valid JSON with {{prompt}} inside a string, "
            'e.g. {"message": "{{prompt}}"}',
        ) from exc


def extract_path(data: Any, path: str) -> str | None:
    """Follow a dotted path like `choices.0.message.content`. `.` returns the whole body."""
    path = path.strip()
    if path.startswith("$"):
        path = path[1:].lstrip(".")
    node = data
    if path and path != ".":
        for part in path.split("."):
            if isinstance(node, list) and part.lstrip("-").isdigit():
                index = int(part)
                if -len(node) <= index < len(node):
                    node = node[index]
                    continue
                return None
            if isinstance(node, dict) and part in node:
                node = node[part]
                continue
            return None
    if node is None:
        return None
    return node if isinstance(node, str) else json.dumps(node, ensure_ascii=False)


async def send(target: TargetSnapshot, prompt: str) -> TargetResponse:
    settings = get_settings()
    await net_guard.check_url(target.base_url)
    body = render_body(target.body_template, prompt)
    headers = {"Content-Type": "application/json", "User-Agent": USER_AGENT, **target.headers}
    limit = settings.target_max_response_bytes

    started = time.perf_counter()
    payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
    chunks: list[bytes] = []
    size = 0
    truncated = False
    status = 0
    # One retry on transport failures (timeout / connection reset) so a single network hiccup
    # does not turn a test into an error. HTTP error statuses are never retried.
    for attempt in (1, 2):
        chunks, size, truncated = [], 0, False
        try:
            async with httpx.AsyncClient(timeout=settings.target_timeout_s, follow_redirects=False) as client:
                async with client.stream(target.method, target.base_url, content=payload, headers=headers) as response:
                    async for chunk in response.aiter_bytes():
                        chunks.append(chunk)
                        size += len(chunk)
                        if size >= limit:
                            truncated = True
                            break
                    status = response.status_code
            break
        except httpx.TimeoutException:
            if attempt == 1:
                continue
            return TargetResponse(False, None, int((time.perf_counter() - started) * 1000), "", None,
                                  error=f"Target timed out after {settings.target_timeout_s:.0f}s (2 attempts)")
        except httpx.HTTPError as exc:
            if attempt == 1:
                continue
            return TargetResponse(False, None, None, "", None, error=f"Could not reach target: {exc}")

    latency_ms = int((time.perf_counter() - started) * 1000)
    raw_text = b"".join(chunks)[:limit].decode("utf-8", errors="replace")

    if status >= 400:
        return TargetResponse(False, status, latency_ms, raw_text, None,
                              error=f"Target returned HTTP {status}", truncated=truncated)
    try:
        data: Any = json.loads(raw_text)
    except ValueError:
        if target.response_path.strip() in (".", "$"):
            return TargetResponse(True, status, latency_ms, raw_text, raw_text, truncated=truncated)
        return TargetResponse(False, status, latency_ms, raw_text, None,
                              error="Target response is not JSON", truncated=truncated)

    extracted = extract_path(data, target.response_path)
    if extracted is None:
        return TargetResponse(False, status, latency_ms, raw_text, None,
                              error=f"response_path '{target.response_path}' not found in response",
                              truncated=truncated)
    return TargetResponse(True, status, latency_ms, raw_text, extracted, truncated=truncated)
