"""Hosted-demo bootstrap: demo and Shield targets are re-pointed at public URLs, idempotently."""

from datetime import UTC, datetime

import pytest
from pydantic import SecretStr
from sqlmodel import Session

from app import bootstrap
from app.config import get_settings
from app.db import engine, init_db
from app.models import Target


def test_point_demo_targets(monkeypatch: pytest.MonkeyPatch) -> None:
    init_db()
    settings = get_settings()
    monkeypatch.setattr(settings, "demo_sahayak_url", "https://sahayak.example.app/")
    monkeypatch.setattr(settings, "demo_target_api_key", SecretStr("k-123"))
    monkeypatch.setattr(settings, "public_api_base_url", "https://api.example.app")
    with Session(engine) as s:
        demo = Target(name="Sahayak Seva (demo)", base_url="http://127.0.0.1:8101/chat", body_template="{}",
                      response_path="reply", verification_token="t", ownership_confirmed_at=datetime.now(UTC),
                      fix_webhook_url="http://127.0.0.1:8101/admin/prompt")
        other = Target(name="My bot", base_url="https://mine.example.com/chat", body_template="{}",
                       response_path="reply", verification_token="t", ownership_confirmed_at=datetime.now(UTC))
        s.add(demo)
        s.add(other)
        s.commit()
        s.refresh(demo)
        s.refresh(other)
        shield = Target(name="Sahayak Seva (demo) + Shield", base_url="http://127.0.0.1:8010/api/v1/shield/x/chat",
                        body_template="{}", response_path="reply", verification_token="t",
                        ownership_confirmed_at=datetime.now(UTC), shield_for_target_id=demo.id)
        s.add(shield)
        s.commit()
        ids = (demo.id, other.id, shield.id)

    assert bootstrap.point_demo_targets() >= 2
    assert bootstrap.point_demo_targets() == 0  # idempotent
    with Session(engine) as s:
        d, o, sh = (s.get(Target, i) for i in ids)
        assert d is not None and o is not None and sh is not None
        assert d.base_url == "https://sahayak.example.app/chat"
        assert d.fix_webhook_url == "https://sahayak.example.app/admin/prompt"
        assert d.headers["x-demo-key"] == "k-123"
        assert o.base_url == "https://mine.example.com/chat" and "x-demo-key" not in o.headers  # untouched
        assert sh.base_url == f"https://api.example.app/api/v1/shield/{d.id}/chat"
