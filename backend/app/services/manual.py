"""Manual testing from the browser extension: prepare an attack, then check the reply the person got.

Results are saved in one "Browser extension" campaign per target, so they appear in Chakravyuh with full
evidence like any other finding. Ownership rules are the same as everywhere else: verified targets only.
"""

from datetime import UTC, datetime

from sqlmodel import Session, col, select

from app.errors import AppError, not_found
from app.integrations.sarvam import SarvamError
from app.models import Campaign, Result, Target, TestCase
from app.schemas.campaign import CampaignConfig
from app.schemas.enums import (
    AttackCategory,
    AttackMode,
    CampaignStatus,
    LanguageCode,
    Modality,
    ScriptVariant,
    VerificationStatus,
)
from app.schemas.manual import (
    ManualAttackOut,
    ManualAttackRequest,
    ManualCheckOut,
    ManualCheckRequest,
    ManualMatchOut,
)
from app.services import mappers
from app.services.attack_engine.mutators import localize, new_marker
from app.services.attack_engine.seed_loader import get_seed
from app.services.campaigns import origin_of, require_verified
from app.services.detectors.base import DetectionInput
from app.services.scoring import evaluate

CAMPAIGN_NAME = "Browser extension · manual tests"


def match(session: Session, page_url: str) -> ManualMatchOut:
    scheme, host, port = origin_of(page_url)
    origin = f"{scheme}://{host}" + (f":{port}" if port not in (None, 80, 443) else "")
    if scheme not in ("http", "https") or not host:
        return ManualMatchOut(origin=origin, target=None, reason="This page is not a website (http/https).")
    targets = [t for t in session.exec(select(Target).where(col(Target.shield_for_target_id).is_(None))).all()
               if origin_of(t.base_url) == (scheme, host, port)]
    verified = [t for t in targets if t.verification_status is VerificationStatus.VERIFIED]
    if verified:
        return ManualMatchOut(origin=origin, target=mappers.target_out(verified[0]), reason=None)
    if targets:
        return ManualMatchOut(origin=origin, target=None,
                              reason="A target exists for this site but its ownership is not verified yet.")
    return ManualMatchOut(origin=origin, target=None,
                          reason="No Chakravyuh target for this site. Add it under Targets and verify ownership first.")


def _verified_target(session: Session, target_id: int) -> Target:
    target = session.get(Target, target_id)
    if target is None:
        raise not_found("Target", target_id)
    require_verified(target)
    return target


async def prepare(session: Session, body: ManualAttackRequest) -> ManualAttackOut:
    _verified_target(session, body.target_id)
    seed = get_seed(body.template_id)
    if seed is None:
        raise not_found("Attack template", body.template_id)
    variant = ScriptVariant.NATIVE if body.language is LanguageCode.EN else body.variant
    try:
        attack = await localize(seed, body.language, variant, None, new_marker() if seed.marker_required else None)
    except SarvamError as exc:
        raise AppError(502, "sarvam_unavailable", f"Could not prepare the attack: {exc.message}") from exc
    return ManualAttackOut(
        target_id=body.target_id, template_id=seed.id, category=seed.category, technique=seed.technique,
        language=body.language, variant=variant, attack_text=attack.text, english_gloss=attack.english_gloss,
        marker_token=attack.marker_token, detected_language=attack.detected_language,
        detected_script=attack.detected_script, mutation_chain=attack.mutation_chain,
    )


def _campaign(session: Session, target_id: int) -> Campaign:
    existing = session.exec(select(Campaign).where(col(Campaign.target_id) == target_id,
                                                   col(Campaign.name) == CAMPAIGN_NAME)).first()
    if existing is not None:
        return existing
    now = datetime.now(UTC)
    config = CampaignConfig(mode=AttackMode.STATIC, categories=list(AttackCategory), languages=list(LanguageCode),
                            variants=list(ScriptVariant), use_judge=True)
    campaign = Campaign(target_id=target_id, name=CAMPAIGN_NAME, config=config.model_dump(mode="json"),
                        status=CampaignStatus.COMPLETED, started_at=now, finished_at=now)
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    return campaign


async def check(session: Session, body: ManualCheckRequest) -> ManualCheckOut:
    target = _verified_target(session, body.target_id)
    seed = get_seed(body.template_id)
    if seed is None:
        raise not_found("Attack template", body.template_id)
    evaluation = await evaluate(
        DetectionInput(
            category=seed.category, attack_text=body.attack_text, attacker_goal=body.english_gloss or seed.text,
            reply=body.reply, marker_token=body.marker_token, canary_strings=list(target.canary_strings),
            system_prompt_hint=target.system_prompt_hint,
        ),
        use_judge=body.use_judge,
    )
    campaign = _campaign(session, body.target_id)
    assert campaign.id is not None
    tc = TestCase(
        campaign_id=campaign.id, template_id=seed.id, category=seed.category, technique=seed.technique,
        language=body.language, variant=body.variant, mutation_chain=[m.value for m in body.mutation_chain],
        attack_text=body.attack_text, english_gloss=body.english_gloss, marker_token=body.marker_token,
        modality=Modality.TEXT,
    )
    session.add(tc)
    session.commit()
    session.refresh(tc)
    assert tc.id is not None
    result = Result(
        test_case_id=tc.id, campaign_id=campaign.id, trial=1, http_status=None, raw_response=body.reply,
        extracted_reply=body.reply, latency_ms=None, verdict=evaluation.verdict, confidence=evaluation.confidence,
        severity=evaluation.severity, detector_hits=mappers.dump_hits(evaluation.hits),
        judge_rationale=evaluation.judge_rationale,
    )
    session.add(result)
    campaign.total_cases += 1
    campaign.completed_cases += 1
    campaign.finished_at = datetime.now(UTC)
    session.add(campaign)
    session.commit()
    session.refresh(result)
    assert result.id is not None
    return ManualCheckOut(
        result_id=result.id, campaign_id=campaign.id, verdict=evaluation.verdict, confidence=evaluation.confidence,
        severity=evaluation.severity, evidence=[h.evidence for h in evaluation.hits if h.fired and h.evidence],
        judge_rationale=evaluation.judge_rationale,
    )
