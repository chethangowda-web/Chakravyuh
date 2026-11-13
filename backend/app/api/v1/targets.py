from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session, col, select

from app.db import get_session
from app.models import Target
from app.schemas.target import (
    TargetCreate,
    TargetList,
    TargetOut,
    TargetUpdate,
    TestConnectionRequest,
    TestConnectionResponse,
    VerifyTargetResponse,
)
from app.services import mappers, targets
from app.services.campaigns import get_target_or_404

router = APIRouter(prefix="/targets", tags=["targets"])


@router.get("", operation_id="listTargets")
def list_targets(session: Session = Depends(get_session)) -> TargetList:
    rows = session.exec(select(Target).order_by(col(Target.id).desc())).all()
    return TargetList(items=[mappers.target_out(t) for t in rows])


@router.post("", status_code=status.HTTP_201_CREATED, operation_id="createTarget")
def create_target(body: TargetCreate, session: Session = Depends(get_session)) -> TargetOut:
    return targets.create(session, body)


@router.get("/{target_id}", operation_id="getTarget")
def get_target(target_id: int, session: Session = Depends(get_session)) -> TargetOut:
    return mappers.target_out(get_target_or_404(session, target_id))


@router.put("/{target_id}", operation_id="updateTarget")
def update_target(target_id: int, body: TargetUpdate, session: Session = Depends(get_session)) -> TargetOut:
    return targets.update(session, target_id, body)


@router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteTarget")
def delete_target(target_id: int, session: Session = Depends(get_session)) -> Response:
    targets.delete_target(session, target_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{target_id}/verify", operation_id="verifyTarget")
async def verify_target(target_id: int, session: Session = Depends(get_session)) -> VerifyTargetResponse:
    return await targets.verify(session, target_id)


@router.post("/{target_id}/test-connection", operation_id="testTargetConnection")
async def test_connection(
    target_id: int, body: TestConnectionRequest, session: Session = Depends(get_session)
) -> TestConnectionResponse:
    return await targets.test_connection(session, target_id, body.prompt)
