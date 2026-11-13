"""Contract smoke tests: the app boots, routes return contract shapes, errors are uniform."""

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.enums import LanguageCode

client = TestClient(app)


def test_health() -> None:
    with TestClient(app) as c:  # triggers lifespan (DB init)
        res = c.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database_ok"] is True
    assert body["sarvam_configured"] is False
    assert "sarvam_api_key" not in body


def test_meta_enums_cover_all_languages() -> None:
    res = client.get("/api/v1/meta/enums")
    assert res.status_code == 200
    values = {lang["value"] for lang in res.json()["languages"]}
    assert values == {code.value for code in LanguageCode}


def test_not_found_is_uniform() -> None:
    res = client.get("/api/v1/campaigns/999999")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "not_found"


def test_validation_error_is_uniform() -> None:
    res = client.post("/api/v1/targets", json={"name": ""})
    assert res.status_code == 422
    body = res.json()
    assert body["error"]["code"] == "validation_error"
    assert body["error"]["details"]["issues"]


def test_openapi_has_no_default_422_schema() -> None:
    schema = app.openapi()
    assert "HTTPValidationError" not in schema["components"]["schemas"]
    assert "ErrorResponse" in schema["components"]["schemas"]


def test_target_crud_masks_headers_and_requires_verification() -> None:
    with TestClient(app) as c:
        res = c.post("/api/v1/targets", json={
            "name": "Demo", "base_url": "http://127.0.0.1:8100/chat",
            "body_template": '{"message": "{{prompt}}"}', "response_path": "reply",
            "headers": {"Authorization": "Bearer super-secret-token-123"},
            "canary_strings": ["BB-OVERRIDE-4417-KESTREL"], "ownership_confirmed": True,
        })
        assert res.status_code == 201, res.text
        target = res.json()
        assert target["verification_status"] == "unverified"
        assert "super-secret" not in res.text
        assert target["headers"][0]["value_masked"].startswith("Bear")

        # campaigns are refused until the target is verified
        res = c.post("/api/v1/campaigns", json={
            "target_id": target["id"], "name": "x",
            "config": {"categories": ["jailbreak"], "languages": ["en-IN"], "variants": ["native"]},
        })
        assert res.status_code == 409
        assert res.json()["error"]["code"] == "target_not_verified"

        # 127.0.0.1 is allowlisted by default -> verified without a token file
        res = c.post(f"/api/v1/targets/{target['id']}/verify")
        assert res.json()["verification_status"] == "verified"

        assert c.delete(f"/api/v1/targets/{target['id']}").status_code == 204


def test_invalid_body_template_rejected() -> None:
    res = client.post("/api/v1/targets", json={
        "name": "Bad", "base_url": "https://example.com/chat", "body_template": "message={{prompt}}",
        "response_path": "reply", "ownership_confirmed": True,
    })
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "invalid_body_template"


def test_ownership_must_be_confirmed() -> None:
    res = client.post("/api/v1/targets", json={
        "name": "X", "base_url": "https://example.com/chat", "body_template": '{"m": "{{prompt}}"}',
        "response_path": "reply", "ownership_confirmed": False,
    })
    assert res.status_code == 422
