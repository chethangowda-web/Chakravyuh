"""Campaign lifecycle: estimate, create + start, list, results, cancel."""

from urllib.parse import urlsplit

from sqlalchemy import case as sql_case
from sqlalchemy import func
from sqlmodel import Session, col, select

from app.config import get_settings
from app.errors import AppError, not_found
from app.models import Campaign, Result, Target, TestCase
from app.schemas.campaign import (
    CampaignConfig,
    CampaignCreate,
    CampaignEstimateResponse,
    CampaignLiveOut,
    CampaignOut,
    LiveEvent,
)
from app.schemas.enums import (
    AttackCategory,
    AttackMode,
    CampaignStatus,
    Confidence,
    LanguageCode,
    Severity,
    Verdict,
    VerificationStatus,
)
from app.schemas.result import ResultPage
from app.services import mappers, runner
from app.services.attack_engine import adaptive
from app.services.attack_engine.generator import estimate_sarvam_calls, plan_cases
from app.services.target_adapter import TargetSnapshot


def get_target_or_404(session: Session, target_id: int) -> Target:
    target = session.get(Target, target_id)
    if target is None:
        raise not_found("Target", target_id)
    return target


def require_verified(target: Target) -> None:
    if target.verification_status is not VerificationStatus.VERIFIED:
        raise AppError(409, "target_not_verified",
                       "Verify ownership of this target before running attacks against it.")


def _origin(url: str) -> tuple[str, str, int | None]:
    parts = urlsplit(url.strip())
    try:
        port = parts.port
    except ValueError:
        port = None
    default = {"http": 80, "https": 443}.get(parts.scheme)
    return parts.scheme.lower(), (parts.hostname or "").lower(), port or default


def require_same_origin(base_url: str, webhook_url: str | None) -> None:
    """The fix webhook must live on the verified target's own origin.

    Verification proves ownership of one origin; the webhook receives the target's auth headers,
    so it must not be able to point anywhere else.
    """
    if webhook_url and _origin(webhook_url) != _origin(base_url):
        raise AppError(400, "webhook_origin_mismatch",
                       "The fix webhook must be on the same scheme, host and port as the target URL "
                       "(that is the origin whose ownership was verified).")


def estimate(session: Session, target_id: int, config: CampaignConfig) -> CampaignEstimateResponse:
    get_target_or_404(session, target_id)
    if config.mode is AttackMode.ADAPTIVE:
        return _estimate_adaptive(config)
    cases, capped = plan_cases(config)
    warnings: list[str] = []
    if capped:
        warnings.append(f"Plan exceeds {config.max_cases} tests; cases were evenly sampled down.")
    if not cases:
        warnings.append("No attack seeds match the selected categories.")
    if not get_settings().sarvam_configured:
        warnings.append("SARVAM_API_KEY is not configured: Indic attacks and the judge will fail.")
    return CampaignEstimateResponse(
        total_cases=len(cases),
        estimated_target_calls=len(cases),
        estimated_sarvam_calls=estimate_sarvam_calls(cases, config.use_judge),
        capped=capped,
        warnings=warnings,
    )


def _estimate_adaptive(config: CampaignConfig) -> CampaignEstimateResponse:
    missions, capped = adaptive.plan_missions(config.categories, config.languages, config.max_cases)
    warnings = [
        f"Adaptive mode: {len(missions)} missions, up to {config.max_turns} attempts each. "
        "A mission stops at its first successful attack, so the real number of calls is usually lower."
    ]
    if not get_settings().sarvam_configured:
        warnings.append("SARVAM_API_KEY is not configured: the adaptive attacker will fail.")
    return CampaignEstimateResponse(
        total_cases=len(missions),
        estimated_target_calls=len(missions) * config.max_turns,
        estimated_sarvam_calls=adaptive.estimate_calls(len(missions), config.max_turns, config.use_judge),
        capped=capped,
        warnings=warnings,
    )


async def create_and_start(session: Session, body: CampaignCreate) -> CampaignOut:
    target = get_target_or_404(session, body.target_id)
    require_verified(target)
    if body.config.mode is AttackMode.ADAPTIVE:
        missions, _ = adaptive.plan_missions(body.config.categories, body.config.languages, body.config.max_cases)
        campaign = Campaign(
            target_id=body.target_id, name=body.name, config=body.config.model_dump(mode="json"),
            status=CampaignStatus.QUEUED, total_cases=len(missions),
        )
        session.add(campaign)
        session.commit()
        session.refresh(campaign)
        assert campaign.id is not None
        runner.start(campaign.id, TargetSnapshot.of(target), missions=missions,
                     max_turns=body.config.max_turns, use_judge=body.config.use_judge)
        return mappers.campaigns_out(session, [campaign])[0]
    cases, _ = plan_cases(body.config)
    if not cases:
        raise AppError(422, "empty_campaign", "No attack seeds match the selected categories.")
    campaign = Campaign(
        target_id=body.target_id, name=body.name, config=body.config.model_dump(mode="json"),
        status=CampaignStatus.QUEUED, total_cases=len(cases),
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    assert campaign.id is not None
    runner.start(campaign.id, TargetSnapshot.of(target), planned=cases, use_judge=body.config.use_judge)
    return mappers.campaigns_out(session, [campaign])[0]


def get_campaign_or_404(session: Session, campaign_id: int) -> Campaign:
    campaign = session.get(Campaign, campaign_id)
    if campaign is None:
        raise not_found("Campaign", campaign_id)
    return campaign


def get_out(session: Session, campaign_id: int) -> CampaignOut:
    return mappers.campaigns_out(session, [get_campaign_or_404(session, campaign_id)])[0]


def list_out(session: Session) -> list[CampaignOut]:
    campaigns = list(session.exec(select(Campaign).order_by(col(Campaign.id).desc())).all())
    return mappers.campaigns_out(session, campaigns)


def cancel(session: Session, campaign_id: int) -> CampaignOut:
    campaign = get_campaign_or_404(session, campaign_id)
    if campaign.status not in (CampaignStatus.QUEUED, CampaignStatus.RUNNING):
        raise AppError(409, "not_running", "Campaign is not running.")
    runner.cancel(campaign_id)
    campaign.status = CampaignStatus.CANCELLED
    session.add(campaign)
    session.commit()
    return get_out(session, campaign_id)


def severity_order() -> object:
    return sql_case(
        {Severity.CRITICAL: 4, Severity.HIGH: 3, Severity.MEDIUM: 2, Severity.LOW: 1},
        value=Result.severity,
        else_=0,
    )


def list_results(
    session: Session,
    campaign_id: int,
    *,
    severity: Severity | None,
    language: LanguageCode | None,
    category: AttackCategory | None,
    verdict: Verdict | None,
    offset: int,
    limit: int,
) -> ResultPage:
    get_campaign_or_404(session, campaign_id)
    query = select(Result, TestCase).join(TestCase, col(TestCase.id) == col(Result.test_case_id)).where(
        col(Result.campaign_id) == campaign_id
    )
    if severity is not None:
        query = query.where(col(Result.severity) == severity)
    if verdict is not None:
        query = query.where(col(Result.verdict) == verdict)
    if language is not None:
        query = query.where(col(TestCase.language) == language)
    if category is not None:
        query = query.where(col(TestCase.category) == category)

    total = session.exec(select(func.count()).select_from(query.subquery())).one()
    rows = session.exec(
        query.order_by(severity_order().desc(), col(Result.id)).offset(offset).limit(limit)  # type: ignore[attr-defined]
    ).all()
    return ResultPage(
        items=[mappers.result_summary(r, tc) for r, tc in rows], total=int(total), offset=offset, limit=limit
    )


def get_result_detail(session: Session, result_id: int) -> object:
    result = session.get(Result, result_id)
    if result is None:
        raise not_found("Result", result_id)
    tc = session.get(TestCase, result.test_case_id)
    assert tc is not None
    return mappers.result_detail(result, tc)


_FEED = 12


def _excerpt(text: str, limit: int = 140) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def live(session: Session, campaign_id: int) -> CampaignLiveOut:
    """Live pipeline: how many attacks reached each step, plus the latest attacks as a feed."""
    campaign = get_campaign_or_404(session, campaign_id)
    active = campaign.status in (CampaignStatus.QUEUED, CampaignStatus.RUNNING)
    results = session.exec(
        select(Result.test_case_id, Result.verdict, Result.confidence).where(col(Result.campaign_id) == campaign_id)
    ).all()
    answered = {tc_id for tc_id, _, _ in results}
    tc_ids = set(session.exec(select(TestCase.id).where(col(TestCase.campaign_id) == campaign_id)).all())
    written = len(tc_ids | answered)  # regression reruns reuse test cases owned by the original campaign
    pending_ids = tc_ids - answered if active else set()

    verdicts = [v for _, v, _ in results]
    judged = sum(1 for _, v, conf in results if v is not Verdict.ERROR and conf is Confidence.LIKELY)
    analysed = sum(1 for v in verdicts if v is not Verdict.ERROR)

    events: list[LiveEvent] = []
    done_rows = session.exec(
        select(Result, TestCase).join(TestCase, col(TestCase.id) == col(Result.test_case_id))
        .where(col(Result.campaign_id) == campaign_id).order_by(col(Result.id).desc()).limit(_FEED)
    ).all()
    for r, tc in done_rows:
        assert r.id is not None and tc.id is not None
        events.append(LiveEvent(
            test_case_id=tc.id, result_id=r.id, turn=tc.turn, language=tc.language, variant=tc.variant,
            category=tc.category, attack_excerpt=_excerpt(tc.attack_text), stage="done", verdict=r.verdict,
            severity=r.severity,
            decided_by=None if r.verdict is Verdict.ERROR else ("judge" if r.confidence is Confidence.LIKELY else "rules"),
            created_at=mappers.utc(r.created_at),
        ))
    if pending_ids:
        for tc in session.exec(
            select(TestCase).where(col(TestCase.id).in_(pending_ids)).order_by(col(TestCase.id).desc()).limit(_FEED)
        ).all():
            assert tc.id is not None
            events.append(LiveEvent(
                test_case_id=tc.id, result_id=None, turn=tc.turn, language=tc.language, variant=tc.variant,
                category=tc.category, attack_excerpt=_excerpt(tc.attack_text), stage="attacking", verdict=None,
                severity=None, decided_by=None, created_at=mappers.utc(tc.created_at),
            ))
    events.sort(key=lambda e: e.created_at, reverse=True)

    return CampaignLiveOut(
        status=campaign.status, mode=AttackMode(campaign.config.get("mode", AttackMode.STATIC.value)),
        planned=campaign.total_cases, written=written, in_flight=len(pending_ids), analysed=analysed,
        decided_by_rules=analysed - judged, decided_by_judge=judged,
        vulnerable=sum(1 for v in verdicts if v is Verdict.VULNERABLE),
        safe=sum(1 for v in verdicts if v is Verdict.SAFE),
        errors=sum(1 for v in verdicts if v is Verdict.ERROR),
        recent=events[:_FEED],
    )
