from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.schemas.dashboard import DashboardSummary
from app.services import analytics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", operation_id="getDashboardSummary")
def get_summary(campaign_id: int | None = None, session: Session = Depends(get_session)) -> DashboardSummary:
    return analytics.dashboard(session, campaign_id)
