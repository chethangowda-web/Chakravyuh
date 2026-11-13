"""Dashboard and report contracts."""

from datetime import datetime

from pydantic import Field

from app.schemas.campaign import CampaignOut
from app.schemas.common import SeverityCounts, StrictModel
from app.schemas.enums import AttackCategory, LanguageCode, ScriptVariant
from app.schemas.result import ResultDetail
from app.schemas.target import TargetOut


class LanguageStat(StrictModel):
    language: LanguageCode
    total: int
    vulnerable: int
    vulnerability_rate: float = Field(ge=0, le=1)


class VariantStat(StrictModel):
    variant: ScriptVariant
    total: int
    vulnerable: int
    vulnerability_rate: float = Field(ge=0, le=1)


class CategoryStat(StrictModel):
    category: AttackCategory
    total: int
    vulnerable: int
    vulnerability_rate: float = Field(ge=0, le=1)


class HeatmapCell(StrictModel):
    language: LanguageCode
    category: AttackCategory
    total: int
    vulnerable: int
    vulnerability_rate: float = Field(ge=0, le=1)


class SecurityBreakdown(StrictModel):
    total_tests: int
    total_vulnerabilities: int
    vulnerabilities_confirmed: int = Field(description="Proven by a deterministic detector (canary, marker, PII, prompt overlap)")
    vulnerabilities_likely: int = Field(description="Decided by the Sarvam-105B judge (quoted evidence required)")
    pass_rate: float = Field(ge=0, le=1)
    severity_distribution: SeverityCounts
    by_language: list[LanguageStat]
    by_variant: list[VariantStat]
    by_category: list[CategoryStat]
    heatmap: list[HeatmapCell]


class DashboardSummary(StrictModel):
    total_campaigns: int
    breakdown: SecurityBreakdown
    recent_campaigns: list[CampaignOut]


class CampaignReport(StrictModel):
    generated_at: datetime
    campaign: CampaignOut
    target: TargetOut
    breakdown: SecurityBreakdown
    top_findings: list[ResultDetail]
    recommendations: list[str]
