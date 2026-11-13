from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.db import get_session
from app.schemas.adaptive import FixApplyRequest, FixList, FixProposalOut, HardeningOut, MissionList
from app.services import fixer, missions

router = APIRouter(tags=["hardening"])


@router.get("/campaigns/{campaign_id}/missions", operation_id="listCampaignMissions")
def list_missions(campaign_id: int, session: Session = Depends(get_session)) -> MissionList:
    return missions.list_missions(session, campaign_id)


@router.get("/campaigns/{campaign_id}/fixes", operation_id="listCampaignFixes")
def list_fixes(campaign_id: int, session: Session = Depends(get_session)) -> FixList:
    return FixList(items=fixer.list_for_campaign(session, campaign_id))


@router.post("/campaigns/{campaign_id}/fixes", status_code=status.HTTP_201_CREATED, operation_id="proposeFix")
async def propose_fix(campaign_id: int, session: Session = Depends(get_session)) -> FixProposalOut:
    return await fixer.propose(session, campaign_id)


@router.get("/fixes/{fix_id}", operation_id="getFix")
def get_fix(fix_id: int, session: Session = Depends(get_session)) -> FixProposalOut:
    return fixer.get_fix(session, fix_id)


@router.post("/fixes/{fix_id}/apply", operation_id="applyFix")
async def apply_fix(fix_id: int, body: FixApplyRequest, session: Session = Depends(get_session)) -> FixProposalOut:
    return await fixer.apply(session, fix_id, body)


@router.get("/campaigns/{campaign_id}/hardening", operation_id="getHardeningTimeline")
def get_hardening(campaign_id: int, session: Session = Depends(get_session)) -> HardeningOut:
    return fixer.hardening(session, campaign_id)
