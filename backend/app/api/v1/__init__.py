"""Version 1 API router. Mounted at /api/v1."""

from fastapi import APIRouter

from app.api.v1 import (
    attacks,
    campaigns,
    challenge,
    dashboard,
    fixes,
    health,
    manual,
    meta,
    regression,
    results,
    shield,
    targets,
    voice,
)
from app.schemas.common import ErrorResponse

ERROR_RESPONSES: dict[int | str, dict[str, object]] = {
    "4XX": {"model": ErrorResponse, "description": "Client error"},
    "5XX": {"model": ErrorResponse, "description": "Server error"},
}

api_router = APIRouter(prefix="/api/v1", responses=ERROR_RESPONSES)
for module in (health, meta, targets, attacks, campaigns, fixes, results, voice, regression, dashboard, shield, manual, challenge):
    api_router.include_router(module.router)
