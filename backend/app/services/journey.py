"""The guided Test → Fix → Protect journey: which steps are done, computed from real data."""

from pydantic import Field
from sqlmodel import Session, col, select

from app.models import Campaign, FixProposal, Target
from app.schemas.common import StrictModel
from app.schemas.enums import CampaignStatus, VerificationStatus
from app.services.campaign_kinds import not_interactive


class JourneyStep(StrictModel):
    key: str = Field(description="target | attack | fix | protect")
    done: bool
    detail: str = Field(description="One plain-language line about this step's state")
    link: str = Field(description="Where in the app to do (or see) this step")


class Journey(StrictModel):
    steps: list[JourneyStep]
    next_key: str | None = Field(description="The first step that is not done yet; null when all are done")


def journey(session: Session) -> Journey:
    targets = [t for t in session.exec(select(Target).order_by(col(Target.id))).all() if t.shield_for_target_id is None]
    verified = [t for t in targets if t.verification_status is VerificationStatus.VERIFIED]
    campaigns = session.exec(
        select(Campaign).where(col(Campaign.parent_campaign_id).is_(None), col(Campaign.status) == CampaignStatus.COMPLETED,
                               *not_interactive())
        .order_by(col(Campaign.id).desc())
    ).all()
    fix = session.exec(select(FixProposal).where(col(FixProposal.applied).is_(True))
                       .order_by(col(FixProposal.id).desc())).first()
    shielded = session.exec(select(Target).where(col(Target.shield_for_target_id).is_not(None))).first()

    first = verified[0] if verified else (targets[0] if targets else None)
    steps = [
        JourneyStep(
            key="target", done=bool(verified),
            detail=(f"{len(verified)} verified target{'s' if len(verified) != 1 else ''}" if verified
                    else "Add your chatbot and verify you own it" if not targets
                    else "Verify ownership of your target"),
            link=f"/targets/{first.id}" if first and not verified else "/targets" if verified else "/targets/new",
        ),
        JourneyStep(
            key="attack", done=bool(campaigns),
            detail=(f"{len(campaigns)} finished campaign{'s' if len(campaigns) != 1 else ''}" if campaigns
                    else "Run a campaign in Indian languages"),
            link=f"/campaigns/{campaigns[0].id}" if campaigns else "/campaigns/new",
        ),
        JourneyStep(
            key="fix", done=fix is not None,
            detail="A Sarvam fix was applied and re-tested" if fix else "Open a campaign → Auto-fix with Sarvam",
            link=(f"/regression/{fix.regression_id}" if fix and fix.regression_id
                  else f"/campaigns/{campaigns[0].id}" if campaigns else "/campaigns"),
        ),
        JourneyStep(
            key="protect", done=shielded is not None,
            detail="Shield is guarding a bot" if shielded else "Put Shield in front of your bot",
            link=f"/shield?target={shielded.shield_for_target_id}" if shielded else "/shield",
        ),
    ]
    return Journey(steps=steps, next_key=next((s.key for s in steps if not s.done), None))
