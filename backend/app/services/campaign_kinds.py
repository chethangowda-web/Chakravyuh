"""Interactive, one-message-at-a-time campaigns (browser extension, Live Judge Challenge).

They are real findings and appear under Campaigns, but they are individual hand-made tests, not systematic runs, so
they are kept out of the aggregate statistics (dashboard, Chakravyuh formation, journey, Shield comparison): a judge
typing ten attacks must not silently move the numbers shown elsewhere.
"""

from typing import Any

from sqlmodel import col

from app.models import Campaign

INTERACTIVE_PREFIXES = ("Judge challenge", "Browser extension")


def not_interactive() -> list[Any]:
    """SQL conditions that exclude interactive campaigns: use as `.where(*not_interactive())`."""
    return [col(Campaign.name).not_like(f"{prefix}%") for prefix in INTERACTIVE_PREFIXES]
