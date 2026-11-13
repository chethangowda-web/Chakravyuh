from fastapi import APIRouter

from app.config import get_settings
from app.db import database_ok
from app.schemas.system import HealthResponse

router = APIRouter(tags=["system"])


@router.get("/health", operation_id="getHealth")
def get_health() -> HealthResponse:
    settings = get_settings()
    db_ok = database_ok()
    return HealthResponse(
        status="ok" if db_ok else "degraded",
        app_name=settings.app_name,
        version=settings.app_version,
        database_ok=db_ok,
        sarvam_configured=settings.sarvam_configured,
    )
