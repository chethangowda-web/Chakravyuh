from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.schemas.dashboard import DashboardSummary
from app.services import analytics, formation, journey

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", operation_id="getDashboardSummary")
def get_summary(campaign_id: int | None = None, session: Session = Depends(get_session)) -> DashboardSummary:
    return analytics.dashboard(session, campaign_id)


@router.get("/journey", operation_id="getJourney")
def get_journey(session: Session = Depends(get_session)) -> journey.Journey:
    """The guided Test → Fix → Protect flow: which steps are done and where to go next."""
    return journey.journey(session)


@router.get("/formation", operation_id="getFormation")
def get_formation(
    scope: formation.Scope = "bare", campaign_id: int | None = None, session: Session = Depends(get_session)
) -> formation.Formation:
    """Per-language rings and a replay of real attacks for the Living Chakravyuh visual (all campaigns in a
    scope, or one campaign)."""
    return formation.formation(session, scope, campaign_id)
