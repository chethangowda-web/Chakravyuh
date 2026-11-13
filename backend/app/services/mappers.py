"""Convert DB rows into API contract models (the only place this happens)."""

from collections import defaultdict
from datetime import UTC, datetime
from typing import Any

from sqlmodel import Session, col, select

from app.models import AudioAsset, Campaign, RegressionRun, Result, Target, TestCase
from app.schemas.campaign import CampaignConfig, CampaignCounts, CampaignOut
from app.schemas.enums import Severity, Verdict
from app.schemas.result import DetectorHit, ResultDetail, ResultSummary
from app.schemas.target import MaskedHeader, TargetOut
from app.schemas.voice import AudioAssetOut
from app.services.scoring import remediation

SEVERITY_RANK: dict[Severity, int] = {
    Severity.CRITICAL: 4, Severity.HIGH: 3, Severity.MEDIUM: 2, Severity.LOW: 1, Severity.NONE: 0,
}


def utc(dt: datetime) -> datetime:
    """SQLite drops tzinfo; every stored datetime is UTC."""
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)


def utc_opt(dt: datetime | None) -> datetime | None:
    return utc(dt) if dt else None


def mask(value: str) -> str:
    return f"{value[:4]}••••••" if len(value) > 10 else "••••••"


def target_out(t: Target) -> TargetOut:
    assert t.id is not None
    return TargetOut(
        id=t.id, name=t.name, kind=t.kind, base_url=t.base_url, method=t.method,
        headers=[MaskedHeader(name=k, value_masked=mask(v)) for k, v in t.headers.items()],
        body_template=t.body_template, response_path=t.response_path,
        canary_strings=list(t.canary_strings), system_prompt_hint=t.system_prompt_hint,
        fix_webhook_url=t.fix_webhook_url, legit_questions=list(t.legit_questions or []),
        verification_status=t.verification_status, verification_token=t.verification_token,
        created_at=utc(t.created_at),
    )


def collapse_missions(rows: list[tuple[Result, TestCase]]) -> list[tuple[Result, TestCase]]:
    """Adaptive missions make several attempts at one goal; for statistics a mission counts ONCE,
    represented by its most severe attempt (the breach if there was one, else the last attempt).
    Without this, the failed attempts that preceded a breach would inflate the 'safe' count."""
    singles: list[tuple[Result, TestCase]] = []
    missions: dict[str, list[tuple[Result, TestCase]]] = defaultdict(list)
    for row in rows:
        mission_id = row[1].mission_id
        if mission_id:
            missions[mission_id].append(row)
        else:
            singles.append(row)
    for group in missions.values():
        scored = [g for g in group if g[0].verdict is not Verdict.ERROR] or group
        singles.append(max(scored, key=lambda g: (SEVERITY_RANK[g[0].severity], g[0].id or 0)))
    return singles


def campaign_counts(session: Session, campaign_ids: list[int]) -> dict[int, CampaignCounts]:
    counts: dict[int, CampaignCounts] = defaultdict(CampaignCounts)
    if not campaign_ids:
        return counts
    rows = session.exec(
        select(Result, TestCase)
        .join(TestCase, col(TestCase.id) == col(Result.test_case_id))
        .where(col(Result.campaign_id).in_(campaign_ids))
    ).all()
    by_campaign: dict[int, list[tuple[Result, TestCase]]] = defaultdict(list)
    for result, test_case in rows:
        by_campaign[result.campaign_id].append((result, test_case))
    for campaign_id, campaign_rows in by_campaign.items():
        c = counts[campaign_id]
        for result, _ in collapse_missions(campaign_rows):
            if result.verdict is Verdict.VULNERABLE:
                c.vulnerable += 1
            elif result.verdict is Verdict.SAFE:
                c.safe += 1
            elif result.verdict is Verdict.INCONCLUSIVE:
                c.inconclusive += 1
            else:
                c.errors += 1
            if result.verdict is not Verdict.ERROR:
                c.by_severity.add(result.severity)
    return counts


def campaign_out(
    c: Campaign,
    target_name: str,
    counts: CampaignCounts,
    regression_id: int | None = None,
    latest_regression_id: int | None = None,
) -> CampaignOut:
    assert c.id is not None
    progress = (c.completed_cases / c.total_cases) if c.total_cases else 0.0
    return CampaignOut(
        id=c.id, name=c.name, target_id=c.target_id, target_name=target_name,
        config=CampaignConfig.model_validate(c.config), status=c.status,
        total_cases=c.total_cases, completed_cases=c.completed_cases, progress=min(1.0, progress),
        counts=counts, parent_campaign_id=c.parent_campaign_id, regression_id=regression_id,
        latest_regression_id=latest_regression_id, error_message=c.error_message,
        created_at=utc(c.created_at), started_at=utc_opt(c.started_at), finished_at=utc_opt(c.finished_at),
    )


def campaigns_out(session: Session, campaigns: list[Campaign]) -> list[CampaignOut]:
    ids = [c.id for c in campaigns if c.id is not None]
    counts = campaign_counts(session, ids)
    target_ids = {c.target_id for c in campaigns}
    names = {t.id: t.name for t in session.exec(select(Target).where(col(Target.id).in_(target_ids))).all()}
    runs = list(session.exec(
        select(RegressionRun).where(
            col(RegressionRun.new_campaign_id).in_(ids) | col(RegressionRun.base_campaign_id).in_(ids)
        ).order_by(col(RegressionRun.id))
    ).all()) if ids else []
    run_of_new = {r.new_campaign_id: r.id for r in runs}
    latest_of_base = {r.base_campaign_id: r.id for r in runs}  # ordered by id, so last wins
    return [
        campaign_out(c, names.get(c.target_id, "Deleted target"), counts[c.id or 0],
                     run_of_new.get(c.id or 0), latest_of_base.get(c.id or 0))
        for c in campaigns
    ]


def result_summary(r: Result, tc: TestCase) -> ResultSummary:
    assert r.id is not None and tc.id is not None
    return ResultSummary(
        id=r.id, campaign_id=r.campaign_id, test_case_id=tc.id, trial=r.trial, category=tc.category,
        language=tc.language, variant=tc.variant, modality=tc.modality, attack_text=tc.attack_text,
        verdict=r.verdict, confidence=r.confidence, severity=r.severity, latency_ms=r.latency_ms,
        mission_id=tc.mission_id, turn=tc.turn, tactic=tc.tactic, created_at=utc(r.created_at),
    )


def result_detail(r: Result, tc: TestCase) -> ResultDetail:
    hits = [DetectorHit.model_validate(h) for h in r.detector_hits]
    fired = {h.detector.value for h in hits if h.fired}
    summary = result_summary(r, tc)
    return ResultDetail(
        **summary.model_dump(),
        technique=tc.technique, mutation_chain=list(tc.mutation_chain),  # type: ignore[arg-type]
        english_gloss=tc.english_gloss, detected_language=tc.detected_language,
        detected_script=tc.detected_script, marker_token=tc.marker_token, http_status=r.http_status,
        raw_response=r.raw_response, extracted_reply=r.extracted_reply, detector_hits=hits,
        judge_rationale=r.judge_rationale, attacker_note=tc.attacker_note,
        remediation=remediation(tc.category, tc.language, r.verdict, fired),
        audio_id=tc.audio_id, transcript=tc.transcript, transcript_drift=tc.transcript_drift,
    )


def audio_out(a: AudioAsset) -> AudioAssetOut:
    return AudioAssetOut(
        id=a.id, source=a.source, language=a.language, text=a.text, duration_s=a.duration_s,
        url=f"/api/v1/voice/audio/{a.id}", created_at=utc(a.created_at),
    )


def dump_hits(hits: list[Any]) -> list[dict[str, Any]]:
    return [h.to_dict() for h in hits]
