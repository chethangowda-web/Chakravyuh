from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.db import get_session
from app.schemas.campaign import (
    CampaignCreate,
    CampaignEstimateRequest,
    CampaignEstimateResponse,
    CampaignList,
    CampaignLiveOut,
    CampaignOut,
)
from app.schemas.dashboard import CampaignReport
from app.schemas.enums import AttackCategory, LanguageCode, Severity, Verdict
from app.schemas.regression import RegressionCreate, RegressionOut
from app.schemas.result import ResultPage
from app.services import analytics, campaigns, regression

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("/estimate", operation_id="estimateCampaign")
def estimate_campaign(body: CampaignEstimateRequest, session: Session = Depends(get_session)) -> CampaignEstimateResponse:
    return campaigns.estimate(session, body.target_id, body.config)


@router.post("", status_code=status.HTTP_201_CREATED, operation_id="createCampaign")
async def create_campaign(body: CampaignCreate, session: Session = Depends(get_session)) -> CampaignOut:
    return await campaigns.create_and_start(session, body)


@router.get("", operation_id="listCampaigns")
def list_campaigns(session: Session = Depends(get_session)) -> CampaignList:
    return CampaignList(items=campaigns.list_out(session))


@router.get("/{campaign_id}", operation_id="getCampaign")
def get_campaign(campaign_id: int, session: Session = Depends(get_session)) -> CampaignOut:
    return campaigns.get_out(session, campaign_id)


@router.post("/{campaign_id}/cancel", operation_id="cancelCampaign")
def cancel_campaign(campaign_id: int, session: Session = Depends(get_session)) -> CampaignOut:
    return campaigns.cancel(session, campaign_id)


@router.get("/{campaign_id}/results", operation_id="listCampaignResults")
def list_results(
    campaign_id: int,
    severity: Severity | None = None,
    language: LanguageCode | None = None,
    category: AttackCategory | None = None,
    verdict: Verdict | None = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    session: Session = Depends(get_session),
) -> ResultPage:
    return campaigns.list_results(
        session, campaign_id, severity=severity, language=language, category=category,
        verdict=verdict, offset=offset, limit=limit,
    )


@router.post(
    "/{campaign_id}/regression",
    status_code=status.HTTP_201_CREATED,
    operation_id="createRegression",
)
async def create_regression(
    campaign_id: int, body: RegressionCreate, session: Session = Depends(get_session)
) -> RegressionOut:
    return await regression.create(session, campaign_id, body)


@router.get("/{campaign_id}/live", operation_id="getCampaignLive")
def get_live(campaign_id: int, session: Session = Depends(get_session)) -> CampaignLiveOut:
    """Live pipeline view: per-stage counts and the latest attacks (poll while the campaign runs)."""
    return campaigns.live(session, campaign_id)


@router.get("/{campaign_id}/report", operation_id="getCampaignReport")
def get_report(campaign_id: int, session: Session = Depends(get_session)) -> CampaignReport:
    return analytics.report(session, campaign_id)
