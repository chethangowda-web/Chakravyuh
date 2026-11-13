"""Text-vs-voice delta: replay a campaign's attacks as SPEECH and compare, attack by attack.

The same attack text is spoken by Sarvam TTS, transcribed by Sarvam STT and sent to the target, so the
only difference between the two results is the speech layer. Selection is outcome-blind (a stratified
sample by language), otherwise the comparison would be biased towards attacks that already worked.
Attacks whose success depends on an exact injected code are excluded: digits are often transcribed as
words, which would make them fail for reasons unrelated to the target's defences.
"""

from collections import defaultdict
from statistics import mean

from sqlmodel import Session, col, select

from app.errors import AppError
from app.models import Campaign, Result, TestCase
from app.schemas.campaign import CampaignOut
from app.schemas.enums import AttackMode, CampaignStatus, LanguageCode, Modality, Verdict
from app.schemas.voice import VoiceComparisonOut, VoiceLanguageDelta, VoicePair
from app.services import mappers, runner
from app.services.attack_engine.adaptive import MARKER_CATEGORIES
from app.services.campaigns import get_campaign_or_404, get_target_or_404, require_verified
from app.services.runner import VoiceReplayItem
from app.services.target_adapter import TargetSnapshot


def _select(session: Session, campaign_id: int, limit: int) -> list[TestCase]:
    rows = session.exec(
        select(TestCase, Result).join(Result, col(Result.test_case_id) == col(TestCase.id))
        .where(col(TestCase.campaign_id) == campaign_id, col(TestCase.modality) == Modality.TEXT,
               col(Result.verdict) != Verdict.ERROR)
        .order_by(col(TestCase.id))
    ).all()
    by_language: dict[LanguageCode, list[TestCase]] = defaultdict(list)
    seen: set[int] = set()
    for test_case, _ in rows:
        if test_case.category in MARKER_CATEGORIES or test_case.id in seen:
            continue
        seen.add(test_case.id or 0)
        by_language[test_case.language].append(test_case)
    picked: list[TestCase] = []
    index = 0
    while len(picked) < limit and any(index < len(v) for v in by_language.values()):
        for cases in by_language.values():  # round-robin across languages, outcome-blind
            if index < len(cases) and len(picked) < limit:
                picked.append(cases[index])
        index += 1
    return picked


def start(session: Session, base_campaign_id: int, max_attacks: int) -> CampaignOut:
    base = get_campaign_or_404(session, base_campaign_id)
    if base.status in (CampaignStatus.QUEUED, CampaignStatus.RUNNING):
        raise AppError(409, "campaign_running", "Wait for the campaign to finish first.")
    if base.config.get("mode") == AttackMode.VOICE_REPLAY.value:
        raise AppError(409, "already_voice", "This campaign is already a voice replay.")
    target = get_target_or_404(session, base.target_id)
    require_verified(target)
    sources = _select(session, base_campaign_id, max_attacks)
    if len(sources) < 2:
        raise AppError(409, "nothing_to_replay",
                       "Not enough text attacks to replay (code-injection attacks are excluded from voice replay).")

    campaign = Campaign(
        target_id=base.target_id, name=f"{base.name} · voice replay",
        config={**base.config, "mode": AttackMode.VOICE_REPLAY.value}, status=CampaignStatus.QUEUED,
        total_cases=len(sources), parent_campaign_id=base.id,
    )
    session.add(campaign)
    session.commit()
    session.refresh(campaign)
    assert campaign.id is not None
    runner.start(campaign.id, TargetSnapshot.of(target),
                 voice=[VoiceReplayItem(tc.id) for tc in sources if tc.id is not None],
                 use_judge=bool(base.config.get("use_judge", True)))
    return mappers.campaigns_out(session, [campaign])[0]


def _worst(results: list[Result]) -> Result | None:
    usable = [r for r in results if r.verdict is not Verdict.ERROR]
    return max(usable, key=lambda r: (mappers.SEVERITY_RANK[r.severity], r.verdict is Verdict.VULNERABLE), default=None)


def compare(session: Session, voice_campaign_id: int) -> VoiceComparisonOut:
    voice_campaign = get_campaign_or_404(session, voice_campaign_id)
    if voice_campaign.config.get("mode") != AttackMode.VOICE_REPLAY.value or voice_campaign.parent_campaign_id is None:
        raise AppError(409, "not_voice_replay", "This campaign is not a voice replay.")
    all_cases = list(session.exec(select(TestCase).where(col(TestCase.campaign_id) == voice_campaign_id)).all())
    voice_cases = [tc for tc in all_cases if tc.modality is Modality.VOICE]
    # Fresh text twins (same campaign, same source, sent at the same time). Older replays have none,
    # in which case we fall back to the original campaign's text verdict and say so.
    twins = {tc.source_test_case_id: tc for tc in all_cases if tc.modality is Modality.TEXT}
    fresh = bool(twins)
    ids = [tc.id for tc in all_cases if tc.id is not None] + [
        tc.source_test_case_id for tc in voice_cases if tc.source_test_case_id is not None]
    results: dict[int, list[Result]] = defaultdict(list)
    for r in session.exec(select(Result).where(col(Result.test_case_id).in_(ids))).all():
        results[r.test_case_id].append(r)

    pairs: list[VoicePair] = []
    for tc in voice_cases:
        twin = twins.get(tc.source_test_case_id)
        text_case_id = (twin.id if twin else tc.source_test_case_id) or 0
        text = _worst(results.get(text_case_id, []))
        voice = _worst(results.get(tc.id or 0, []))
        if text is None or voice is None:
            continue  # an error on either side makes the pair unusable
        pairs.append(VoicePair(
            language=tc.language, category=tc.category, text_result_id=text.id or 0, voice_result_id=voice.id or 0,
            text_verdict=text.verdict, voice_verdict=voice.verdict, transcript_drift=tc.transcript_drift,
        ))

    def hit(v: Verdict) -> bool:
        return v is Verdict.VULNERABLE

    per_language: dict[LanguageCode, list[int]] = defaultdict(lambda: [0, 0, 0])
    for p in pairs:
        bucket = per_language[p.language]
        bucket[0] += 1
        bucket[1] += hit(p.text_verdict)
        bucket[2] += hit(p.voice_verdict)
    drifts = [p.transcript_drift for p in pairs if p.transcript_drift is not None]
    return VoiceComparisonOut(
        base_campaign_id=voice_campaign.parent_campaign_id, voice_campaign_id=voice_campaign_id,
        text_baseline="fresh" if fresh else "original", pairs=len(pairs),
        text_succeeded=sum(hit(p.text_verdict) for p in pairs),
        voice_succeeded=sum(hit(p.voice_verdict) for p in pairs),
        both=sum(hit(p.text_verdict) and hit(p.voice_verdict) for p in pairs),
        text_only=sum(hit(p.text_verdict) and not hit(p.voice_verdict) for p in pairs),
        voice_only=sum(hit(p.voice_verdict) and not hit(p.text_verdict) for p in pairs),
        mean_transcript_drift=round(mean(drifts), 3) if drifts else None,
        by_language=[VoiceLanguageDelta(language=lang, pairs=b[0], text_succeeded=b[1], voice_succeeded=b[2])
                     for lang in LanguageCode if lang in per_language for b in [per_language[lang]]],
        items=pairs,
    )
