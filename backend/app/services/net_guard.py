"""SSRF protection for every outbound request to a user-supplied URL.

Chakravyuh sends requests to URLs that users type in, so it must not become a proxy
into private networks or cloud metadata endpoints. Rules:
- only http/https
- the host must resolve exclusively to public (global) IP addresses, unless the host
  name is explicitly listed in ALLOWED_PRIVATE_HOSTS (local dev, demo target)
- redirects are never followed (enforced by callers: follow_redirects=False)

Known limitation (documented): DNS is resolved here and again by httpx, so a
DNS-rebinding attacker could race the two lookups. Acceptable for this prototype.
"""

import asyncio
import ipaddress
import socket
from urllib.parse import urlsplit

from app.config import get_settings
from app.errors import AppError


def host_is_allowlisted(host: str) -> bool:
    allowed = {h.lower() for h in get_settings().allowed_private_hosts}
    return host.lower() in allowed


async def check_url(url: str) -> None:
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https"):
        raise AppError(400, "url_blocked", "Only http:// and https:// URLs are allowed")
    host = parts.hostname
    if not host:
        raise AppError(400, "url_blocked", "URL has no host")
    if parts.username or parts.password:
        raise AppError(400, "url_blocked", "Credentials in URLs are not allowed; use headers instead")

    port = parts.port or (443 if parts.scheme == "https" else 80)
    try:
        infos = await asyncio.to_thread(socket.getaddrinfo, host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise AppError(400, "dns_failed", f"Could not resolve host {host}") from exc

    if host_is_allowlisted(host):
        return
    for info in infos:
        address = ipaddress.ip_address(str(info[4][0]).split("%")[0])
        if not address.is_global:
            raise AppError(
                400,
                "url_blocked",
                f"{host} resolves to a private or reserved address ({address}). "
                "For local testing add the host to ALLOWED_PRIVATE_HOSTS.",
            )
