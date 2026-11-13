"""Target CRUD, verification and connection testing."""

from datetime import UTC, datetime

from sqlmodel import Session, col, delete, select

from app.errors import AppError
from app.models import Campaign, RegressionRun, Result, Target, TestCase
from app.schemas.enums import VerificationStatus
from app.schemas.target import (
    TargetCreate,
    TargetOut,
    TargetUpdate,
    TestConnectionResponse,
    VerifyTargetResponse,
)
from app.services import mappers, target_adapter, verification
from app.services.campaigns import get_target_or_404, require_same_origin, require_verified
from app.services.target_adapter import TargetSnapshot

_PREVIEW_CHARS = 2000


def _validate(body_template: str) -> None:
    target_adapter.render_body(body_template, 'probe "quotes" & newlines\n')


def _questions(raw: list[str]) -> list[str] | None:
    cleaned = list(dict.fromkeys(q.strip() for q in raw if q.strip()))
    return cleaned or None


def create(session: Session, body: TargetCreate) -> TargetOut:
    _validate(body.body_template)
    require_same_origin(body.base_url, body.fix_webhook_url)
    target = Target(
        name=body.name, kind=body.kind, base_url=body.base_url.strip(), method=body.method,
        headers=dict(body.headers), body_template=body.body_template, response_path=body.response_path.strip(),
        canary_strings=[c.strip() for c in body.canary_strings if c.strip()],
        system_prompt_hint=body.system_prompt_hint or None, fix_webhook_url=body.fix_webhook_url or None,
        legit_questions=_questions(body.legit_questions),
        verification_token=verification.new_token(), ownership_confirmed_at=datetime.now(UTC),
    )
    session.add(target)
    session.commit()
    session.refresh(target)
    return mappers.target_out(target)


def update(session: Session, target_id: int, body: TargetUpdate) -> TargetOut:
    _validate(body.body_template)
    require_same_origin(body.base_url, body.fix_webhook_url)
    target = get_target_or_404(session, target_id)
    if body.base_url.strip() != target.base_url:
        target.verification_status = VerificationStatus.UNVERIFIED  # new endpoint, re-verify ownership
    target.name = body.name
    target.kind = body.kind
    target.base_url = body.base_url.strip()
    target.method = body.method
    target.body_template = body.body_template
    target.response_path = body.response_path.strip()
    target.canary_strings = [c.strip() for c in body.canary_strings if c.strip()]
    target.system_prompt_hint = body.system_prompt_hint or None
    target.fix_webhook_url = body.fix_webhook_url or None
    target.legit_questions = _questions(body.legit_questions)
    if body.headers is not None:
        target.headers = dict(body.headers)
    session.add(target)
    session.commit()
    session.refresh(target)
    return mappers.target_out(target)


def delete_target(session: Session, target_id: int) -> None:
    get_target_or_404(session, target_id)
    campaign_ids = [c for c in session.exec(select(Campaign.id).where(col(Campaign.target_id) == target_id)).all()]
    if campaign_ids:
        session.exec(delete(RegressionRun).where(  # type: ignore[call-overload]
            col(RegressionRun.base_campaign_id).in_(campaign_ids) | col(RegressionRun.new_campaign_id).in_(campaign_ids)))
        session.exec(delete(Result).where(col(Result.campaign_id).in_(campaign_ids)))  # type: ignore[call-overload]
        session.exec(update_null_sources(campaign_ids))  # type: ignore[call-overload]
        session.exec(delete(TestCase).where(col(TestCase.campaign_id).in_(campaign_ids)))  # type: ignore[call-overload]
        session.exec(delete(Campaign).where(col(Campaign.id).in_(campaign_ids)))  # type: ignore[call-overload]
    session.exec(delete(Target).where(col(Target.id) == target_id))  # type: ignore[call-overload]
    session.commit()


def update_null_sources(campaign_ids: list[int]) -> object:
    from sqlmodel import update as sql_update

    source_ids = select(TestCase.id).where(col(TestCase.campaign_id).in_(campaign_ids))
    return sql_update(TestCase).where(col(TestCase.source_test_case_id).in_(source_ids)).values(source_test_case_id=None)


async def verify(session: Session, target_id: int) -> VerifyTargetResponse:
    target = get_target_or_404(session, target_id)
    outcome = await verification.verify(target.base_url, target.verification_token)
    target.verification_status = outcome.status
    session.add(target)
    session.commit()
    return VerifyTargetResponse(verification_status=outcome.status, method=outcome.method, message=outcome.message)


async def test_connection(session: Session, target_id: int, prompt: str) -> TestConnectionResponse:
    target = get_target_or_404(session, target_id)
    require_verified(target)  # even one free-text probe needs proof of ownership
    try:
        response = await target_adapter.send(TargetSnapshot.of(target), prompt)
    except AppError as exc:
        return TestConnectionResponse(ok=False, http_status=None, latency_ms=None, extracted_reply=None,
                                      raw_response_preview="", error=exc.message)
    return TestConnectionResponse(
        ok=response.ok, http_status=response.http_status, latency_ms=response.latency_ms,
        extracted_reply=response.extracted, raw_response_preview=response.raw_text[:_PREVIEW_CHARS],
        error=response.error,
    )
