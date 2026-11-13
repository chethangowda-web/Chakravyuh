"""Uniform error handling.

Every error leaving the API has the shape defined by `schemas.common.ErrorResponse`:
    {"error": {"code": str, "message": str, "details": object | null}}
"""

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.schemas.common import ErrorBody, ErrorResponse

logger = logging.getLogger("chakravyuh")


class AppError(Exception):
    """Raise from services/routers for any expected failure."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


def not_found(resource: str, resource_id: object) -> AppError:
    return AppError(404, "not_found", f"{resource} {resource_id} not found")


def not_implemented(feature: str) -> AppError:
    return AppError(501, "not_implemented", f"{feature} is not implemented yet")


def _error_response(
    status_code: int, code: str, message: str, details: dict[str, Any] | None = None
) -> JSONResponse:
    body = ErrorResponse(error=ErrorBody(code=code, message=message, details=details))
    return JSONResponse(status_code=status_code, content=body.model_dump(mode="json"))


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return _error_response(exc.status_code, exc.code, exc.message, exc.details)

    from app.integrations.sarvam import SarvamError

    @app.exception_handler(SarvamError)
    async def _sarvam_error(_: Request, exc: SarvamError) -> JSONResponse:
        status = exc.status_code if exc.status_code in (422, 503) else 502
        return _error_response(status, exc.code, f"Sarvam AI: {exc.message}")

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        issues = [
            {"loc": [str(p) for p in err.get("loc", ())], "msg": str(err.get("msg", ""))}
            for err in exc.errors()
        ]
        return _error_response(422, "validation_error", "Request validation failed", {"issues": issues})

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _error_response(exc.status_code, "http_error", str(exc.detail))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error", exc_info=exc)
        return _error_response(500, "internal_error", "Internal server error")
