"""Hosted-deployment setup for the demo (opt-in; does nothing in local development).

SEED_DEMO_DATA=true      on first boot (no database yet) copy the demo snapshot from backend/seed/ into DATA_DIR,
                         so a fresh server shows the prepared campaigns instead of an empty dashboard.
DEMO_BHARATBANK_URL=...  public origin of the BharatBank demo bot; the demo target (and its fix webhook) is
DEMO_SAHAYAK_URL=...     pointed there on every boot. Same for Sahayak Seva and (DEMO_KAVERI_URL) Kaveri Bank Assist.
DEMO_TARGET_API_KEY=...  if the demo bots require `x-demo-key`, the demo targets send it.
Shield targets are pointed at PUBLIC_API_BASE_URL on every boot.

The snapshot's demo targets were verified on localhost; on a server the bots must serve the matching token
(`CHAKRAVYUH_VERIFY_TOKEN` on each bot) so that "Re-check" on the target page passes there too.
"""

import logging
import shutil
from pathlib import Path

from sqlmodel import Session, select

from app.config import get_settings
from app.db import engine
from app.models import Target

logger = logging.getLogger(__name__)

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"

_DEMO_TARGETS = {  # target-name prefix -> settings attribute holding the bot's public origin
    "BharatBank Assist": "demo_bharatbank_url",
    "Sahayak Seva": "demo_sahayak_url",
    "Kaveri Bank Assist": "demo_kaveri_url",
}


def copy_seed_if_empty() -> bool:
    settings = get_settings()
    db = settings.data_dir / "app.db"
    if not settings.seed_demo_data or db.exists() or not (SEED_DIR / "app.db").exists():
        return False
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SEED_DIR / "app.db", db)
    if (SEED_DIR / "audio").exists():
        shutil.copytree(SEED_DIR / "audio", settings.audio_dir, dirs_exist_ok=True)
    logger.info("Loaded the demo snapshot into %s", settings.data_dir)
    return True


def point_demo_targets() -> int:
    """Idempotent: re-point the demo targets and Shield targets at their public URLs. Returns targets changed."""
    settings = get_settings()
    key = settings.demo_target_api_key.get_secret_value() if settings.demo_target_api_key else ""
    api = settings.public_api_base_url.rstrip("/")
    changed = 0
    with Session(engine) as session:
        for target in session.exec(select(Target)).all():
            before = (target.base_url, target.fix_webhook_url, dict(target.headers))
            if target.shield_for_target_id is not None:
                target.base_url = f"{api}/api/v1/shield/{target.shield_for_target_id}/chat"
            else:
                attr = next((a for prefix, a in _DEMO_TARGETS.items() if target.name.startswith(prefix)), None)
                origin = (getattr(settings, attr) or "").rstrip("/") if attr else ""
                if origin:
                    target.base_url = f"{origin}/chat"
                    target.fix_webhook_url = f"{origin}/admin/prompt"
                    if key:
                        target.headers = {**target.headers, "x-demo-key": key}
            if (target.base_url, target.fix_webhook_url, dict(target.headers)) != before:
                session.add(target)
                changed += 1
        session.commit()
    if changed:
        logger.info("Pointed %d demo/Shield target(s) at their public URLs", changed)
    return changed
