from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.schemas.dashboard import DashboardSummary
from app.services import analytics, journey

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", operation_id="getDashboardSummary")
def get_summary(campaign_id: int | None = None, session: Session = Depends(get_session)) -> DashboardSummary:
    return analytics.dashboard(session, campaign_id)


@router.get("/journey", operation_id="getJourney")
def get_journey(session: Session = Depends(get_session)) -> journey.Journey:
    """The guided Test → Fix → Protect flow: which steps are done and where to go next."""
    return journey.journey(session)
