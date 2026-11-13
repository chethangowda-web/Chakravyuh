"""Ownership verification: a target can be attacked only after it is verified.

Either the host is explicitly allowlisted (local dev / demo), or the target serves its
verification token at  {origin}/.well-known/chakravyuh-verify.txt
"""

import secrets
from dataclasses import dataclass
from urllib.parse import urlsplit

import httpx

from app.errors import AppError
from app.schemas.enums import VerificationMethod, VerificationStatus
from app.services import net_guard

WELL_KNOWN_PATH = "/.well-known/chakravyuh-verify.txt"


def new_token() -> str:
    return f"chakravyuh-verify-{secrets.token_urlsafe(18)}"


def token_url(base_url: str) -> str:
    parts = urlsplit(base_url)
    return f"{parts.scheme}://{parts.netloc}{WELL_KNOWN_PATH}"


@dataclass
class VerificationResult:
    status: VerificationStatus
    method: VerificationMethod | None
    message: str


async def verify(base_url: str, token: str) -> VerificationResult:
    host = urlsplit(base_url).hostname or ""
    if net_guard.host_is_allowlisted(host):
        return VerificationResult(
            VerificationStatus.VERIFIED,
            VerificationMethod.ALLOWLISTED_HOST,
            f"{host} is in ALLOWED_PRIVATE_HOSTS (local development).",
        )

    url = token_url(base_url)
    try:
        await net_guard.check_url(url)
        async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
            response = await client.get(url)
    except AppError as exc:
        return VerificationResult(VerificationStatus.UNVERIFIED, None, exc.message)
    except httpx.HTTPError as exc:
        return VerificationResult(VerificationStatus.UNVERIFIED, None, f"Could not fetch {url}: {exc}")

    if response.status_code == 200 and token in response.text[:4096]:
        return VerificationResult(
            VerificationStatus.VERIFIED, VerificationMethod.TOKEN_FILE, f"Token found at {url}."
        )
    return VerificationResult(
        VerificationStatus.UNVERIFIED,
        None,
        f"Serve the verification token as plain text at {url} and try again "
        f"(got HTTP {response.status_code}).",
    )
