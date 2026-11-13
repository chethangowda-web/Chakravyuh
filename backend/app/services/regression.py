"""Regression: rerun a campaign's failed attacks (exact same text) and diff before/after."""

from collections import defaultdict

from sqlmodel import Session, col, select

from app.errors import AppError, not_found
from app.models import Campaign, FixProposal, RegressionRun, Result, TestCase
from app.schemas.enums import CampaignStatus, RegressionOutcome, Severity, Verdict
from app.schemas.regression import (
    GeneralizationOut,
    RegressionCaseOut,
    RegressionCreate,
    RegressionOut,
    RegressionSummary,
)
from app.services import runner
from app.services.campaigns import get_campaign_or_404, get_target_or_404, require_verified
from app.services.mappers import SEVERITY_RANK, utc
from app.services.target_adapter import TargetSnapshot

_FAILED = (Verdict.VULNERABLE, Verdict.INCONCLUSIVE)


def _results_by_case(session: Session, case_ids: list[int]) -> dict[int, list[Result]]:
    grouped: dict[int, list[Result]] = defaultdict(list)
    if case_ids:
        for r in session.exec(select(Result).where(col(Result.test_case_id).in_(case_ids))).all():
            grouped[r.test_case_id].append(r)
    return grouped


def _worst(results: list[Result]) -> Severity:
    valid = [r.severity for r in results if r.verdict is not Verdict.ERROR]
    return max(valid, key=lambda s: SEVERITY_RANK[s], default=Severity.NONE)


async def create(session: Session, base_campaign_id: int, body: RegressionCreate) -> RegressionOut:
    base = get_campaign_or_404(session, base_campaign_id)
    if base.status in (CampaignStatus.QUEUED, CampaignStatus.RUNNING):
        raise AppError(409, "campaign_running", "Wait for the campaign to finish before running a regression.")
    target = get_target_or_404(session, base.target_id)
    require_verified(target)

    base_cases = list(session.exec(select(TestCase).where(col(TestCase.campaign_id) == base_campaign_id)).all())
    results = _results_by_case(session, [tc.id for tc in base_cases if tc.id is not None])
    if body.only_failed:
        base_cases = [tc for tc in base_cases if any(r.verdict in _FAILED for r in results.get(tc.id or 0, []))]
    if not base_cases:
        raise AppError(409, "nothing_to_rerun", "This campaign has no failed tests to rerun.")

    root_name = base.name
    while root_name.endswith(" · regression"):  # chained fix rounds must not pile up suffixes
        root_name = root_name.removesuffix(" · regression")
    new_campaign = Campaign(
        target_id=base.target_id, name=f"{root_name} · regression", config=dict(base.config),
        status=CampaignStatus.QUEUED, total_cases=len(base_cases), parent_campaign_id=base.id,
    )
    session.add(new_campaign)
    session.commit()
    session.refresh(new_campaign)
    assert new_campaign.id is not None

    copies = [
        TestCase(
            campaign_id=new_campaign.id, source_test_case_id=tc.id, template_id=tc.template_id,
            category=tc.category, technique=tc.technique, language=tc.language, variant=tc.variant,
            mutation_chain=list(tc.mutation_chain), attack_text=tc.attack_text, english_gloss=tc.english_gloss,
            detected_language=tc.detected_language, detected_script=tc.detected_script,
            marker_token=tc.marker_token, modality=tc.modality, audio_id=tc.audio_id,
            transcript=tc.transcript, transcript_drift=tc.transcript_drift,
        )
        for tc in base_cases
    ]
    session.add_all(copies)
    run = RegressionRun(base_campaign_id=base_campaign_id, new_campaign_id=new_campaign.id,
                        trials=body.trials, only_failed=body.only_failed)
    session.add(run)
    session.commit()
    session.refresh(run)
    for tc in copies:
        session.refresh(tc)

    use_judge = bool(base.config.get("use_judge", True))
    runner.start(new_campaign.id, TargetSnapshot.of(target),
                 existing_ids=[tc.id for tc in copies if tc.id is not None], trials=body.trials, use_judge=use_judge)
    assert run.id is not None
    return get(session, run.id)


def _outcome(before_vulnerable: bool, vulnerable_trials: int, trials: int) -> RegressionOutcome:
    if before_vulnerable:
        if vulnerable_trials == 0:
            return RegressionOutcome.FIXED
        return RegressionOutcome.STILL_VULNERABLE if vulnerable_trials == trials else RegressionOutcome.FLAKY
    return RegressionOutcome.NEW_VULNERABILITY if vulnerable_trials > 0 else RegressionOutcome.FIXED


def get(session: Session, regression_id: int) -> RegressionOut:
    run = session.get(RegressionRun, regression_id)
    if run is None:
        raise not_found("Regression", regression_id)
    assert run.id is not None
    new_campaign = session.get(Campaign, run.new_campaign_id)
    assert new_campaign is not None

    new_cases = list(session.exec(
        select(TestCase).where(col(TestCase.campaign_id) == run.new_campaign_id).order_by(col(TestCase.id))
    ).all())
    source_ids = [tc.source_test_case_id for tc in new_cases if tc.source_test_case_id is not None]
    before = _results_by_case(session, source_ids)
    after = _results_by_case(session, [tc.id for tc in new_cases if tc.id is not None])

    fix = session.exec(select(FixProposal).where(col(FixProposal.regression_id) == run.id)).first()
    fix_ids = set(fix.fix_case_ids or []) if fix else set()
    heldout_ids = set(fix.heldout_case_ids or []) if fix else set()

    summary = RegressionSummary()
    cases: list[RegressionCaseOut] = []
    for tc in new_cases:
        before_results = before.get(tc.source_test_case_id or 0, [])
        after_results = [r for r in after.get(tc.id or 0, []) if r.verdict is not Verdict.ERROR]
        before_vulnerable = any(r.verdict is Verdict.VULNERABLE for r in before_results)
        vulnerable_trials = sum(1 for r in after_results if r.verdict is Verdict.VULNERABLE)
        done = len(after.get(tc.id or 0, [])) >= run.trials
        outcome = _outcome(before_vulnerable, vulnerable_trials, len(after_results) or run.trials) if done else None
        if outcome is not None:
            setattr(summary, outcome.value, getattr(summary, outcome.value) + 1)
        cases.append(RegressionCaseOut(
            base_test_case_id=tc.source_test_case_id or 0, category=tc.category, language=tc.language,
            variant=tc.variant, attack_text=tc.attack_text, before_severity=_worst(before_results),
            after_severity=_worst(after_results) if done else None, vulnerable_trials=vulnerable_trials,
            trials=run.trials, outcome=outcome,
            split="fix" if tc.source_test_case_id in fix_ids else "heldout" if tc.source_test_case_id in heldout_ids else None,
        ))

    return RegressionOut(
        id=run.id, base_campaign_id=run.base_campaign_id, new_campaign_id=run.new_campaign_id,
        status=new_campaign.status, trials=run.trials, only_failed=run.only_failed, summary=summary,
        cases=cases, fix_id=fix.id if fix else None, fix_summary=fix.summary if fix else None,
        generalization=generalization(cases) if heldout_ids else None, created_at=utc(run.created_at),
    )


_STILL = (RegressionOutcome.STILL_VULNERABLE, RegressionOutcome.FLAKY)


def generalization(cases: list[RegressionCaseOut]) -> GeneralizationOut:
    """Fixed-set vs held-out results: did the patch only fix what it was shown?"""
    fix_cases = [c for c in cases if c.split == "fix"]
    heldout_cases = [c for c in cases if c.split == "heldout"]
    return GeneralizationOut(
        fix_set_total=len(fix_cases),
        fix_set_still_vulnerable=sum(1 for c in fix_cases if c.outcome in _STILL),
        heldout_total=len(heldout_cases),
        heldout_still_vulnerable=sum(1 for c in heldout_cases if c.outcome in _STILL),
        complete=all(c.outcome is not None for c in fix_cases + heldout_cases),
    )


def latest_for_campaign(session: Session, campaign_id: int) -> int | None:
    run = session.exec(
        select(RegressionRun).where(col(RegressionRun.base_campaign_id) == campaign_id)
        .order_by(col(RegressionRun.id).desc())
    ).first()
    return run.id if run else None
