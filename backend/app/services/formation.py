"""Data for the "Living Chakravyuh" visual: one ring per language plus a replay of real recent attacks.

scope=bare    targets without Shield (what attackers face today)
scope=shield  the "<bot> + Shield" targets (the same attacks with Shield in front)
"""

from typing import Literal

from pydantic import Field
from sqlmodel import Session, col, select

from app.errors import not_found
from app.models import Campaign, Result, Target, TestCase
from app.schemas.common import StrictModel
from app.schemas.dashboard import LanguageStat
from app.schemas.enums import AttackCategory, CampaignStatus, LanguageCode, Severity, Verdict
from app.services import analytics
from app.services.campaign_kinds import not_interactive

Scope = Literal["bare", "shield"]
_REPLAY = 40


class FormationAttack(StrictModel):
    result_id: int
    language: LanguageCode
    category: AttackCategory
    breached: bool
    severity: Severity
    detail: str | None = Field(description="Short evidence for a breach, e.g. 'Exposed: Aadhaar'")


class Formation(StrictModel):
    scope: Scope
    campaigns: int
    rings: list[LanguageStat] = Field(description="Per-language attack success, same counting as the dashboard")
    attacks: list[FormationAttack] = Field(description="Most recent real attacks, oldest first, for the replay")


def formation(session: Session, scope: Scope, campaign_id: int | None = None) -> Formation:
    """All finished original campaigns in `scope`, or just one campaign when `campaign_id` is given."""
    if campaign_id is not None:
        campaign = session.get(Campaign, campaign_id)
        if campaign is None:
            raise not_found("Campaign", campaign_id)
        target = session.get(Target, campaign.target_id)
        scope = "shield" if target is not None and target.shield_for_target_id is not None else "bare"
        campaign_ids = [campaign_id]
    else:
        shielded = (col(Target.shield_for_target_id).is_not(None) if scope == "shield"
                    else col(Target.shield_for_target_id).is_(None))
        campaign_ids = [
            c for c in session.exec(
                select(Campaign.id).join(Target, col(Target.id) == col(Campaign.target_id))
                .where(col(Campaign.parent_campaign_id).is_(None), col(Campaign.status) == CampaignStatus.COMPLETED,
                       shielded, *not_interactive())
            ).all() if c is not None
        ]
    rings = analytics.breakdown(session, campaign_ids).by_language if campaign_ids else []

    # An evenly spaced sample across ALL results in scope (not just the latest few), so the replay's mix of
    # leaks and blocks matches the rings instead of whatever the last run happened to be.
    rows = list(session.exec(
        select(Result, TestCase).join(TestCase, col(TestCase.id) == col(Result.test_case_id))
        .where(col(Result.campaign_id).in_(campaign_ids), col(Result.verdict).in_([Verdict.VULNERABLE, Verdict.SAFE]))
        .order_by(col(Result.id))
    ).all()) if campaign_ids else []
    if len(rows) > _REPLAY:
        step = len(rows) / _REPLAY
        rows = [rows[int(i * step)] for i in range(_REPLAY)]
    attacks: list[FormationAttack] = []
    for r, tc in rows:
        assert r.id is not None
        breached = r.verdict is Verdict.VULNERABLE
        fired = [h for h in (r.detector_hits or []) if h.get("fired") and h.get("detector") != "refusal"]
        evidence = next((("Leaked a planted secret" if h.get("detector") == "canary" else h.get("evidence")) for h in fired), None)
        attacks.append(FormationAttack(
            result_id=r.id, language=tc.language, category=tc.category, breached=breached, severity=r.severity,
            detail=(str(evidence)[:70] if breached and evidence else None),
        ))
    return Formation(scope=scope, campaigns=len(campaign_ids), rings=rings, attacks=attacks)
