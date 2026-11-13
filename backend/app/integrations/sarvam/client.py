"""Single entry point for every Sarvam AI HTTP call.

- Auth via `api-subscription-key` header (backend only).
- Bounded concurrency (per event loop) to respect rate limits.
- Retries with exponential backoff on 429 / 5xx / network errors (honours Retry-After).
- Optional response cache in SQLite to save credits (translate, text-lid, tts, judge).
"""

import asyncio
import hashlib
import json
import logging
from typing import Any

import httpx
from sqlmodel import Session

from app.config import get_settings
from app.db import engine
from app.models.cache import SarvamCache

logger = logging.getLogger("chakravyuh.sarvam")

_MAX_ATTEMPTS = 3
_semaphores: dict[int, asyncio.Semaphore] = {}


class SarvamError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def _semaphore() -> asyncio.Semaphore:
    loop_id = id(asyncio.get_running_loop())
    sem = _semaphores.get(loop_id)
    if sem is None:
        sem = asyncio.Semaphore(get_settings().sarvam_max_concurrency)
        _semaphores[loop_id] = sem
    return sem


def _cache_key(path: str, payload: dict[str, Any]) -> str:
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(f"{path}|{canonical}".encode()).hexdigest()


def _cache_get(key: str) -> dict[str, Any] | None:
    with Session(engine) as session:
        row = session.get(SarvamCache, key)
        return dict(row.response) if row else None


def _cache_put(key: str, path: str, response: dict[str, Any]) -> None:
    with Session(engine) as session:
        session.merge(SarvamCache(key=key, endpoint=path, response=response))
        session.commit()


def _api_key() -> str:
    settings = get_settings()
    if not settings.sarvam_configured or settings.sarvam_api_key is None:
        raise SarvamError(503, "sarvam_not_configured", "SARVAM_API_KEY is not set on the server")
    return settings.sarvam_api_key.get_secret_value().strip()


def _error_message(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return response.text[:300]
    if isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict) and err.get("message"):
            return str(err["message"])[:300]
        if body.get("detail"):
            return str(body["detail"])[:300]
    return response.text[:300]


async def _request(path: str, *, json_body: dict[str, Any] | None = None,
                   data: dict[str, str] | None = None,
                   files: dict[str, tuple[str, bytes, str]] | None = None) -> dict[str, Any]:
    settings = get_settings()
    headers = {"api-subscription-key": _api_key()}
    last_error: SarvamError | None = None

    async with _semaphore():
        async with httpx.AsyncClient(base_url=settings.sarvam_base_url, timeout=settings.sarvam_timeout_s) as http:
            for attempt in range(1, _MAX_ATTEMPTS + 1):
                try:
                    response = await http.post(path, headers=headers, json=json_body, data=data, files=files)
                except httpx.HTTPError as exc:
                    last_error = SarvamError(502, "sarvam_unreachable", f"Sarvam request failed: {exc}")
                    delay = 2 ** (attempt - 1)
                else:
                    if response.status_code < 400:
                        result: dict[str, Any] = response.json()
                        return result
                    message = _error_message(response)
                    if response.status_code == 429 or response.status_code >= 500:
                        last_error = SarvamError(response.status_code, "sarvam_unavailable", message)
                        retry_after = response.headers.get("retry-after", "")
                        delay = float(retry_after) if retry_after.replace(".", "", 1).isdigit() else 2 ** attempt
                    else:
                        raise SarvamError(response.status_code, "sarvam_rejected", message)
                if attempt < _MAX_ATTEMPTS:
                    logger.warning("Sarvam %s attempt %d failed (%s); retrying in %.1fs",
                                   path, attempt, last_error.message if last_error else "", delay)
                    await asyncio.sleep(min(delay, 10))

    assert last_error is not None
    raise last_error


async def post_json(path: str, payload: dict[str, Any], *, cache: bool = False) -> dict[str, Any]:
    key = _cache_key(path, payload) if cache else None
    if key:
        cached = await asyncio.to_thread(_cache_get, key)
        if cached is not None:
            return cached
    result = await _request(path, json_body=payload)
    if key:
        await asyncio.to_thread(_cache_put, key, path, result)
    return result


async def post_multipart(path: str, data: dict[str, str],
                         files: dict[str, tuple[str, bytes, str]]) -> dict[str, Any]:
    return await _request(path, data=data, files=files)
