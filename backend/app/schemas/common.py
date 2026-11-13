"""Base model and shared response shapes."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import Severity


class StrictModel(BaseModel):
    """Base for every API model.

    - unknown fields are rejected on input
    - in response schemas, fields with defaults are still marked required, because the
      server always sends them (so TS response types have no spurious `?`)
    """

    model_config = ConfigDict(extra="forbid", json_schema_serialization_defaults_required=True)


class ErrorBody(StrictModel):
    code: str = Field(description="Machine-readable error code, e.g. `not_found`")
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(StrictModel):
    error: ErrorBody


class SeverityCounts(StrictModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    none: int = 0

    def add(self, severity: Severity) -> None:
        setattr(self, severity.value, getattr(self, severity.value) + 1)
