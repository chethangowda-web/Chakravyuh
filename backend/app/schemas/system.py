"""Health and metadata contracts."""

from typing import Literal

from app.schemas.common import StrictModel
from app.schemas.enums import (
    AttackCategory,
    AttackWrapper,
    LanguageCode,
    ScriptVariant,
    Severity,
)


class HealthResponse(StrictModel):
    status: Literal["ok", "degraded"]
    app_name: str
    version: str
    database_ok: bool
    sarvam_configured: bool  # boolean only — the key itself is never exposed


class LanguageOption(StrictModel):
    value: LanguageCode
    label: str
    native_label: str


class ScriptVariantOption(StrictModel):
    value: ScriptVariant
    label: str
    description: str


class CategoryOption(StrictModel):
    value: AttackCategory
    label: str
    description: str


class WrapperOption(StrictModel):
    value: AttackWrapper
    label: str
    description: str


class SeverityOption(StrictModel):
    value: Severity
    label: str
    rank: int  # 4 = critical … 0 = none


class MetaEnumsResponse(StrictModel):
    languages: list[LanguageOption]
    script_variants: list[ScriptVariantOption]
    categories: list[CategoryOption]
    wrappers: list[WrapperOption]
    severities: list[SeverityOption]
