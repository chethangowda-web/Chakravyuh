"""Ownership verification cannot be bypassed: every path that sends traffic needs a verified target,
and the fix webhook (which receives the target's auth headers) must live on the verified origin."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.campaigns import require_same_origin

BASE = {
    "name": "Owned", "base_url": "http://127.0.0.1:8100/chat",
    "body_template": '{"message": "{{prompt}}"}', "response_path": "reply", "ownership_confirmed": True,
}


def _create(c: TestClient, **overrides: object) -> dict:
    res = c.post("/api/v1/targets", json={**BASE, **overrides})
    assert res.status_code == 201, res.text
    return res.json()


def test_test_connection_refused_until_verified() -> None:
    with TestClient(app) as c:
        target = _create(c)
        res = c.post(f"/api/v1/targets/{target['id']}/test-connection", json={"prompt": "hi"})
        assert res.status_code == 409
        assert res.json()["error"]["code"] == "target_not_verified"
        c.delete(f"/api/v1/targets/{target['id']}")


def test_changing_url_drops_verification() -> None:
    with TestClient(app) as c:
        target = _create(c)
        assert c.post(f"/api/v1/targets/{target['id']}/verify").json()["verification_status"] == "verified"
        res = c.put(f"/api/v1/targets/{target['id']}", json={
            **{k: v for k, v in BASE.items() if k != "ownership_confirmed"},
            "base_url": "http://localhost:8100/chat",
        })
        assert res.status_code == 200, res.text
        assert res.json()["verification_status"] == "unverified"
        c.delete(f"/api/v1/targets/{target['id']}")


def test_webhook_on_another_origin_is_rejected() -> None:
    with TestClient(app) as c:
        res = c.post("/api/v1/targets", json={**BASE, "fix_webhook_url": "https://evil.example.com/collect"})
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "webhook_origin_mismatch"

        target = _create(c, fix_webhook_url="http://127.0.0.1:8100/admin/prompt")
        res = c.put(f"/api/v1/targets/{target['id']}", json={
            **{k: v for k, v in BASE.items() if k != "ownership_confirmed"},
            "fix_webhook_url": "http://127.0.0.1:9999/admin/prompt",  # same host, different port
        })
        assert res.status_code == 400
        assert res.json()["error"]["code"] == "webhook_origin_mismatch"
        c.delete(f"/api/v1/targets/{target['id']}")


def test_same_origin_rules() -> None:
    require_same_origin("https://bot.example.com/chat", None)
    require_same_origin("https://bot.example.com/chat", "https://BOT.example.com:443/admin/prompt")
    for bad in ("http://bot.example.com/admin", "https://bot.example.com.evil.io/x", "https://other.example.com/x"):
        try:
            require_same_origin("https://bot.example.com/chat", bad)
        except Exception as exc:  # noqa: BLE001
            assert getattr(exc, "code", None) == "webhook_origin_mismatch"
        else:
            raise AssertionError(f"{bad} should be rejected")
