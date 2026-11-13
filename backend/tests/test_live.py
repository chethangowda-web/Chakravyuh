"""Live pipeline endpoint: per-stage counts and the feed for a running campaign."""

from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.db import engine
from app.main import app
from app.models import Campaign, Result, Target, TestCase
from app.schemas.enums import (
    AttackCategory,
    CampaignStatus,
    Confidence,
    LanguageCode,
    ScriptVariant,
    Severity,
    Verdict,
)


def test_live_counts_stages_and_feed() -> None:
    with TestClient(app) as c:
        with Session(engine) as s:
            target = Target(name="t", base_url="http://127.0.0.1:8100/chat", body_template='{"m": "{{prompt}}"}',
                            response_path="reply", verification_token="tok", ownership_confirmed_at=datetime.now(UTC))
            s.add(target)
            s.commit()
            s.refresh(target)
            campaign = Campaign(target_id=target.id or 0, name="live", status=CampaignStatus.RUNNING, total_cases=5,
                                config={"mode": "static", "categories": ["jailbreak"], "languages": ["kn-IN"],
                                        "variants": ["native"]})
            s.add(campaign)
            s.commit()
            s.refresh(campaign)
            cid = campaign.id or 0

            def case(text: str) -> TestCase:
                tc = TestCase(campaign_id=cid, template_id="x", category=AttackCategory.JAILBREAK, technique="t",
                              language=LanguageCode.KN, variant=ScriptVariant.NATIVE, attack_text=text)
                s.add(tc)
                s.commit()
                s.refresh(tc)
                return tc

            done_rules, done_judge, waiting = case("a1"), case("a2"), case("a3")
            rules_id, judge_id, waiting_id = done_rules.id, done_judge.id, waiting.id
            s.add(Result(test_case_id=rules_id or 0, campaign_id=cid, verdict=Verdict.VULNERABLE,
                         confidence=Confidence.CONFIRMED, severity=Severity.CRITICAL, raw_response=""))
            s.add(Result(test_case_id=judge_id or 0, campaign_id=cid, verdict=Verdict.SAFE,
                         confidence=Confidence.LIKELY, severity=Severity.NONE, raw_response=""))
            s.commit()

        live = c.get(f"/api/v1/campaigns/{cid}/live").json()
        assert (live["planned"], live["written"], live["in_flight"], live["analysed"]) == (5, 3, 1, 2)
        assert (live["decided_by_rules"], live["decided_by_judge"], live["vulnerable"], live["safe"]) == (1, 1, 1, 1)
        stages = {e["test_case_id"]: (e["stage"], e["decided_by"]) for e in live["recent"]}
        assert stages[waiting_id] == ("attacking", None)
        assert stages[rules_id] == ("done", "rules")
        assert stages[judge_id] == ("done", "judge")

        with Session(engine) as s:  # once finished, nothing is "in flight" any more
            camp = s.get(Campaign, cid)
            assert camp is not None
            camp.status = CampaignStatus.COMPLETED
            s.add(camp)
            s.commit()
        assert c.get(f"/api/v1/campaigns/{cid}/live").json()["in_flight"] == 0
