"""Dashboard and report aggregation."""

from collections import defaultdict
from datetime import UTC, datetime

from sqlmodel import Session, col, select

from app.models import Campaign, Result, TestCase
from app.schemas.common import SeverityCounts
from app.schemas.dashboard import (
    CampaignReport,
    CategoryStat,
    DashboardSummary,
    HeatmapCell,
    LanguageStat,
    SecurityBreakdown,
    VariantStat,
)
from app.schemas.enums import AttackCategory, Confidence, LanguageCode, ScriptVariant, Verdict
from app.services import mappers
from app.services.campaign_kinds import not_interactive
from app.services.campaigns import get_campaign_or_404, get_target_or_404


def _rate(vulnerable: int, total: int) -> float:
    return round(vulnerable / total, 4) if total else 0.0


def breakdown(session: Session, campaign_ids: list[int]) -> SecurityBreakdown:
    rows: list[tuple[Result, TestCase]] = []
    if campaign_ids:
        rows = list(session.exec(
            select(Result, TestCase).join(TestCase, col(TestCase.id) == col(Result.test_case_id))
            .where(col(Result.campaign_id).in_(campaign_ids))
        ).all())
    valid = [(r, tc) for r, tc in mappers.collapse_missions(rows) if r.verdict is not Verdict.ERROR]

    severity = SeverityCounts()
    lang: dict[LanguageCode, list[int]] = defaultdict(lambda: [0, 0])
    variant: dict[ScriptVariant, list[int]] = defaultdict(lambda: [0, 0])
    category: dict[AttackCategory, list[int]] = defaultdict(lambda: [0, 0])
    heat: dict[tuple[LanguageCode, AttackCategory], list[int]] = defaultdict(lambda: [0, 0])
    vulnerable_total = 0
    confirmed_total = 0
    safe_total = 0
    for r, tc in valid:
        is_vuln = r.verdict is Verdict.VULNERABLE
        vulnerable_total += is_vuln
        confirmed_total += is_vuln and r.confidence is Confidence.CONFIRMED
        safe_total += r.verdict is Verdict.SAFE
        severity.add(r.severity)
        for bucket in (lang[tc.language], variant[tc.variant], category[tc.category], heat[(tc.language, tc.category)]):
            bucket[0] += 1
            bucket[1] += is_vuln

    return SecurityBreakdown(
        total_tests=len(valid),
        total_vulnerabilities=vulnerable_total,
        vulnerabilities_confirmed=confirmed_total,
        vulnerabilities_likely=vulnerable_total - confirmed_total,
        pass_rate=_rate(safe_total, len(valid)),
        severity_distribution=severity,
        by_language=[LanguageStat(language=k, total=t, vulnerable=v, vulnerability_rate=_rate(v, t))
                     for k in LanguageCode if k in lang for t, v in [lang[k]]],
        by_variant=[VariantStat(variant=k, total=t, vulnerable=v, vulnerability_rate=_rate(v, t))
                    for k in ScriptVariant if k in variant for t, v in [variant[k]]],
        by_category=[CategoryStat(category=k, total=t, vulnerable=v, vulnerability_rate=_rate(v, t))
                     for k in AttackCategory if k in category for t, v in [category[k]]],
        heatmap=[HeatmapCell(language=lk, category=ck, total=t, vulnerable=v, vulnerability_rate=_rate(v, t))
                 for lk in LanguageCode for ck in AttackCategory if (lk, ck) in heat for t, v in [heat[(lk, ck)]]],
    )


def dashboard(session: Session, campaign_id: int | None) -> DashboardSummary:
    if campaign_id is not None:
        get_campaign_or_404(session, campaign_id)
        scope = [campaign_id]
    else:  # all original campaigns; regression reruns would double count
        scope = [c for c in session.exec(
            select(Campaign.id).where(col(Campaign.parent_campaign_id).is_(None), *not_interactive())
        ).all() if c is not None]
    recent = list(session.exec(select(Campaign).order_by(col(Campaign.id).desc()).limit(6)).all())
    total_campaigns = len(session.exec(select(Campaign.id)).all())
    return DashboardSummary(
        total_campaigns=total_campaigns,
        breakdown=breakdown(session, scope),
        recent_campaigns=mappers.campaigns_out(session, recent),
    )


def _recommendations(b: SecurityBreakdown, findings_hits: set[str]) -> list[str]:
    recs: list[str] = []
    english = next((s for s in b.by_language if s.language is LanguageCode.EN), None)
    worst = max((s for s in b.by_language if s.language is not LanguageCode.EN),
                key=lambda s: s.vulnerability_rate, default=None)
    if worst and worst.vulnerability_rate > 0 and (english is None or worst.vulnerability_rate > english.vulnerability_rate):
        base = f"{english.vulnerability_rate:.0%} in English" if english else "the English baseline"
        recs.append(
            f"Guardrails do not transfer across languages: {worst.vulnerability_rate:.0%} of attacks succeeded "
            f"in {worst.language.value} vs {base}. State safety rules for every language, script and code-mixed input."
        )
    romanized = next((s for s in b.by_variant if s.variant is ScriptVariant.ROMANIZED), None)
    native = next((s for s in b.by_variant if s.variant is ScriptVariant.NATIVE), None)
    if romanized and native and romanized.vulnerability_rate > native.vulnerability_rate:
        recs.append("Romanized Indic text (e.g. Hinglish typing) bypasses defences more often than native script; "
                    "normalize or transliterate inputs before safety checks.")
    if "canary" in findings_hits or "pii" in findings_hits:
        recs.append("Secrets or personal data leaked: remove them from the system prompt, fetch them via "
                    "authenticated tools, and add an output filter for secrets and Indian PII formats.")
    if "marker" in findings_hits:
        recs.append("Injected instructions were executed: treat user content as data, and reject messages that "
                    "claim to update rules, enable modes or override the system prompt.")
    if "prompt_leak" in findings_hits:
        recs.append("The system prompt was disclosed: assume it is public and keep nothing confidential in it.")
    if not recs:
        recs.append("No significant weaknesses found in this run. Re-test after every prompt or model change.")
    recs.append("Re-run this campaign as a regression after each fix to confirm it holds in every language.")
    return recs


def report(session: Session, campaign_id: int) -> CampaignReport:
    campaign = get_campaign_or_404(session, campaign_id)
    target = get_target_or_404(session, campaign.target_id)
    b = breakdown(session, [campaign_id])
    rows = list(session.exec(
        select(Result, TestCase).join(TestCase, col(TestCase.id) == col(Result.test_case_id))
        .where(col(Result.campaign_id) == campaign_id, col(Result.verdict) == Verdict.VULNERABLE)
    ).all())
    rows.sort(key=lambda rt: (-mappers.SEVERITY_RANK[rt[0].severity], rt[0].id or 0))
    fired = {h["detector"] for r, _ in rows for h in r.detector_hits if h.get("fired")}
    return CampaignReport(
        generated_at=datetime.now(UTC),
        campaign=mappers.campaigns_out(session, [campaign])[0],
        target=mappers.target_out(target),
        breakdown=b,
        top_findings=[mappers.result_detail(r, tc) for r, tc in rows[:12]],
        recommendations=_recommendations(b, fired),
    )
