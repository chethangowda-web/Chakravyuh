"""Plans the test cases of a campaign (pure, no API calls) and estimates cost."""

from dataclasses import dataclass

from app.schemas.campaign import CampaignConfig
from app.schemas.enums import AttackWrapper, LanguageCode, ScriptVariant
from app.services.attack_engine.seed_loader import Seed, load_seeds


@dataclass(frozen=True)
class PlannedCase:
    seed: Seed
    language: LanguageCode
    variant: ScriptVariant
    wrapper: AttackWrapper | None = None


def variants_for(language: LanguageCode, requested: list[ScriptVariant]) -> list[ScriptVariant]:
    # English has no romanized/code-mixed form; it is always tested natively as the baseline.
    return [ScriptVariant.NATIVE] if language is LanguageCode.EN else list(dict.fromkeys(requested))


def plan_cases(config: CampaignConfig) -> tuple[list[PlannedCase], bool]:
    """Returns (cases, capped). Cases are evenly sampled down to `max_cases` if needed."""
    seeds = [s for s in load_seeds() if s.category in config.categories]
    languages = list(dict.fromkeys(config.languages))
    cases: list[PlannedCase] = []
    for seed in seeds:
        for language in languages:
            variants = variants_for(language, config.variants)
            cases.extend(PlannedCase(seed, language, v) for v in variants)
            for wrapper in dict.fromkeys(config.wrappers):
                if wrapper is AttackWrapper.SCRIPT_SWITCH and language is LanguageCode.EN:
                    continue
                cases.append(PlannedCase(seed, language, variants[0], wrapper))

    limit = config.max_cases
    if len(cases) <= limit:
        return cases, False
    return _sample_per_language(cases, limit), True


def _evenly(items: list[PlannedCase], count: int) -> list[PlannedCase]:
    step = len(items) / count
    return [items[int(i * step)] for i in range(count)]


def _sample_per_language(cases: list[PlannedCase], limit: int) -> list[PlannedCase]:
    """Cap a plan without losing any language: every language gets a fair quota, sampled evenly across
    its own attacks (a single global stride can alias with the plan's order and drop whole languages)."""
    groups: dict[LanguageCode, list[PlannedCase]] = {}
    for case in cases:
        groups.setdefault(case.language, []).append(case)
    quotas = {lang: 0 for lang in groups}
    remaining = limit
    while remaining > 0:  # round-robin quota, never above a language's own size
        open_langs = [lang for lang in groups if quotas[lang] < len(groups[lang])]
        if not open_langs:
            break
        for lang in open_langs:
            if remaining == 0:
                break
            quotas[lang] += 1
            remaining -= 1
    chosen = {id(c) for lang, items in groups.items() for c in _evenly(items, quotas[lang]) if quotas[lang]}
    return [c for c in cases if id(c) in chosen]  # keep the original order


def estimate_sarvam_calls(cases: list[PlannedCase], use_judge: bool) -> int:
    """Upper bound (cached calls are free): translate + text-lid per non-English case, judge for ~half."""
    localized = sum(1 for c in cases if c.language is not LanguageCode.EN)
    script_switch = sum(1 for c in cases if c.wrapper is AttackWrapper.SCRIPT_SWITCH)
    judge = (len(cases) + 1) // 2 if use_judge else 0
    return localized * 2 + script_switch + judge
