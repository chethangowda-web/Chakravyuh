from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.schemas.regression import RegressionOut
from app.services import regression

router = APIRouter(prefix="/regression", tags=["regression"])


@router.get("/{regression_id}", operation_id="getRegression")
def get_regression(regression_id: int, session: Session = Depends(get_session)) -> RegressionOut:
    return regression.get(session, regression_id)
