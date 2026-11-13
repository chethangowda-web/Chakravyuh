"""Held-out auto-fix split, generalization report, over-refusal check and CI gate (no network)."""

import importlib.util
from pathlib import Path

from app.models import HelpfulnessRun, TestCase
from app.schemas.enums import (
    AttackCategory,
    CampaignStatus,
    LanguageCode,
    RegressionOutcome,
    ScriptVariant,
    Severity,
)
from app.schemas.regression import RegressionCaseOut
from app.services import helpfulness
from app.services.attack_engine.seed_loader import load_seeds
from app.services.fixer import split_failures
from app.services.regression import generalization


def _case(tid: int, category: AttackCategory, language: LanguageCode) -> TestCase:
    return TestCase(id=tid, campaign_id=1, template_id="x", category=category, technique="t",
                    language=language, variant=ScriptVariant.NATIVE, attack_text="a")


def test_split_is_stratified_disjoint_and_deterministic() -> None:
    cases = [_case(i, cat, lang) for i, (cat, lang) in enumerate(
        [(c, lang) for c in (AttackCategory.SENSITIVE_DATA_LEAK, AttackCategory.SYSTEM_PROMPT_EXTRACTION)
         for lang in (LanguageCode.EN, LanguageCode.HI, LanguageCode.KN)], start=1)]
    fix, heldout = split_failures(cases)
    fix_ids, heldout_ids = {c.id for c in fix}, {c.id for c in heldout}
    assert fix_ids.isdisjoint(heldout_ids) and len(fix_ids) + len(heldout_ids) == len(cases)
    assert {c.category for c in heldout} == {c.category for c in fix}  # both sides see each category
    again_fix, _ = split_failures(list(reversed(cases)))
    assert {c.id for c in again_fix} == fix_ids  # order of input does not matter


def test_a_single_failure_has_nothing_to_hold_out() -> None:
    fix, heldout = split_failures([_case(1, AttackCategory.JAILBREAK, LanguageCode.EN)])
    assert len(fix) == 1 and heldout == []


def _reg(split: str | None, outcome: RegressionOutcome | None) -> RegressionCaseOut:
    return RegressionCaseOut(
        base_test_case_id=1, category=AttackCategory.JAILBREAK, language=LanguageCode.HI,
        variant=ScriptVariant.NATIVE, attack_text="a", before_severity=Severity.HIGH, after_severity=Severity.NONE,
        vulnerable_trials=0, trials=1, outcome=outcome, split=split,  # type: ignore[arg-type]
    )


def test_generalization_reports_fix_set_and_unseen_attacks_separately() -> None:
    report = generalization([
        _reg("fix", RegressionOutcome.FIXED), _reg("fix", RegressionOutcome.FIXED),
        _reg("heldout", RegressionOutcome.FIXED), _reg("heldout", RegressionOutcome.STILL_VULNERABLE),
        _reg("heldout", RegressionOutcome.FLAKY), _reg(None, RegressionOutcome.STILL_VULNERABLE),
    ])
    assert (report.fix_set_total, report.fix_set_still_vulnerable) == (2, 0)
    assert (report.heldout_total, report.heldout_still_vulnerable) == (3, 2)  # flaky counts as not fixed
    assert report.complete
    assert not generalization([_reg("heldout", None)]).complete


def test_benign_questions_and_answer_rate() -> None:
    assert len(helpfulness.questions()) >= 10
    run = HelpfulnessRun(id=1, target_id=1, phase="after", status=CampaignStatus.COMPLETED, total=4, answered=2,
                         errors=1, items=[
                             {"language": "hi-IN", "question": "q", "reply": "r", "answered": True, "rationale": ""},
                             {"language": "hi-IN", "question": "q", "reply": "r", "answered": False, "rationale": ""},
                             {"language": "en-IN", "question": "q", "reply": "r", "answered": True, "rationale": ""},
                             {"language": "en-IN", "question": "q", "reply": None, "answered": None, "rationale": "err"},
                         ])
    out = helpfulness.to_out(run)
    assert out.answer_rate == round(2 / 3, 4)  # errors are excluded from the denominator
    assert {s.language.value: (s.total, s.answered) for s in out.by_language} == {"hi-IN": (2, 1), "en-IN": (1, 1)}


def test_harmful_content_category_has_indic_seeds() -> None:
    harmful = [s for s in load_seeds() if s.category is AttackCategory.HARMFUL_CONTENT]
    techniques = " ".join(s.technique.lower() for s in harmful)
    assert len(harmful) >= 5
    assert "upi" in techniques and "caste" in techniques and "religion" in techniques and "misinformation" in techniques


def _load_gate():  # type: ignore[no-untyped-def]
    path = Path(__file__).resolve().parents[2] / "scripts" / "ci_gate.py"
    spec = importlib.util.spec_from_file_location("ci_gate", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


BREAKDOWN = {
    "total_tests": 100, "total_vulnerabilities": 40, "severity_distribution": {"critical": 0},
    "by_language": [
        {"language": "en-IN", "total": 30, "vulnerability_rate": 0.20},
        {"language": "kn-IN", "total": 30, "vulnerability_rate": 0.45},
        {"language": "hi-IN", "total": 40, "vulnerability_rate": 0.30},
    ],
}


def test_ci_gate_language_gap_is_worst_indic_minus_english() -> None:
    gate = _load_gate()
    gap, worst = gate.language_gap(BREAKDOWN["by_language"])
    assert (gap, worst) == (0.25, "kn-IN")


def test_ci_gate_blocks_on_gap_and_critical_and_passes_otherwise() -> None:
    gate = _load_gate()
    blocked = gate.evaluate(BREAKDOWN, max_critical=0, max_gap=0.15, max_rate=None)
    assert not blocked["passed"] and "Language Security Gap" in blocked["violations"][0]
    assert gate.evaluate(BREAKDOWN, max_critical=0, max_gap=0.30, max_rate=None)["passed"]
    critical = {**BREAKDOWN, "severity_distribution": {"critical": 2}}
    assert not gate.evaluate(critical, max_critical=0, max_gap=None, max_rate=None)["passed"]


def test_ci_gate_markdown_summary_for_the_github_action() -> None:
    gate = _load_gate()
    report = {**gate.evaluate(BREAKDOWN, max_critical=0, max_gap=0.15, max_rate=None), "campaign_id": 7}
    md = gate.markdown_summary(report, "https://app.example/")
    assert "BLOCKED" in md and "campaign #7" in md
    assert "| Kannada | 45% ← worst |" in md and "| English | 20% |" in md
    assert "https://app.example/campaigns/7" in md
    passed = {**gate.evaluate(BREAKDOWN, max_critical=0, max_gap=0.30, max_rate=None), "campaign_id": 8}
    assert "PASSED" in gate.markdown_summary(passed) and "Why it was blocked" not in gate.markdown_summary(passed)


def test_target_legit_questions_round_trip_and_fallback() -> None:
    from fastapi.testclient import TestClient

    from app.main import app
    from app.models import Target

    with TestClient(app) as c:
        res = c.post("/api/v1/targets", json={
            "name": "Helpdesk", "base_url": "http://127.0.0.1:8101/chat",
            "body_template": '{"message": "{{prompt}}"}', "response_path": "reply", "ownership_confirmed": True,
            "legit_questions": ["How do I apply for a ration card?", "  ", "How do I apply for a ration card?",
                                "When is the next PM-KISAN instalment?"],
        })
        assert res.status_code == 201, res.text
        assert res.json()["legit_questions"] == ["How do I apply for a ration card?",
                                                 "When is the next PM-KISAN instalment?"]
        c.delete(f"/api/v1/targets/{res.json()['id']}")

    own = Target(name="a", base_url="http://x/chat", body_template="{}", response_path="r", verification_token="t",
                 legit_questions=["Q one?"])
    assert helpfulness.questions_for(own) == ["Q one?"]
    default = Target(name="b", base_url="http://x/chat", body_template="{}", response_path="r", verification_token="t")
    assert len(helpfulness.questions_for(default)) == len(helpfulness.questions())
