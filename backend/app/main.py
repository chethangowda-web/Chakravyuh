"""Chakravyuh API entrypoint.

Run:  uvicorn app.main:app --reload --port 8010   (from the backend/ directory)
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import bootstrap
from app.api.v1 import api_router
from app.config import get_settings
from app.db import init_db
from app.errors import register_error_handlers
from app.services import helpfulness, runner

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    bootstrap.copy_seed_if_empty()  # hosted demo only (SEED_DEMO_DATA); before the DB is opened
    init_db()
    bootstrap.point_demo_targets()
    runner.recover_interrupted()
    helpfulness.recover_interrupted()
    yield


def _contract_openapi(app: FastAPI) -> dict[str, Any]:
    """OpenAPI tweaks so the generated TS contract matches what the API really returns.

    FastAPI adds a default 422 `HTTPValidationError` body to every route, but our error
    handler returns `ErrorResponse` for all errors (declared via the 4XX/5XX responses).
    """
    if app.openapi_schema:
        return app.openapi_schema
    from fastapi.openapi.utils import get_openapi

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict):
                operation.get("responses", {}).pop("422", None)
    components = schema.get("components", {}).get("schemas", {})
    components.pop("HTTPValidationError", None)
    components.pop("ValidationError", None)
    app.openapi_schema = schema
    return schema


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=f"{settings.app_name} API",
        version=settings.app_version,
        description="Indic red-teaming lab for LLM and voice applications.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type"],
    )
    register_error_handlers(app)
    app.include_router(api_router)
    app.openapi = lambda: _contract_openapi(app)  # type: ignore[method-assign]
    return app


app = create_app()
