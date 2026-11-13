from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db import get_session
from app.errors import not_found
from app.models import Result, TestCase
from app.schemas.result import ResultDetail
from app.services import mappers

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/{result_id}", operation_id="getResult")
def get_result(result_id: int, session: Session = Depends(get_session)) -> ResultDetail:
    result = session.get(Result, result_id)
    if result is None:
        raise not_found("Result", result_id)
    test_case = session.get(TestCase, result.test_case_id)
    if test_case is None:
        raise not_found("Test case", result.test_case_id)
    return mappers.result_detail(result, test_case)
