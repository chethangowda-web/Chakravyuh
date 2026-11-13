"""Executes campaigns in the background (asyncio tasks inside the API process).

Three kinds of work items:
- PlannedCase    (static campaign):   localize via Sarvam -> store TestCase -> attack -> evaluate
- PlannedMission (adaptive campaign): Sarvam-105B attacker adapts across attempts until it breaches the target
- TestCase id    (regression):        reuse the stored attack text exactly -> attack N trials -> evaluate
"""

import asyncio
import logging
import re
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import func
from sqlmodel import Session, col, select, update

from app.db import engine
from app.errors import AppError
from app.integrations.sarvam import SarvamError, text_lid
from app.models import Campaign, Result, TestCase
from app.schemas.enums import CampaignStatus, LanguageCode, Modality, Mutation, ScriptVariant, Severity, Verdict
from app.services import target_adapter
from app.services.attack_engine import adaptive
from app.services.attack_engine.generator import PlannedCase
from app.services.attack_engine.mutators import localize, new_marker
from app.services.attack_engine.seed_loader import get_seed
from app.services.detectors.base import DetectionInput
from app.services.mappers import dump_hits, utc
from app.services.scoring import evaluate
from app.services.target_adapter import TargetSnapshot

logger = logging.getLogger("chakravyuh.runner")

TARGET_CONCURRENCY = 3
RAW_RESPONSE_LIMIT = 20_000
_tasks: dict[int, asyncio.Task[None]] = {}


def _now() -> datetime:
    return datetime.now(UTC)


def _set_campaign(campaign_id: int, **values: object) -> None:
    with Session(engine) as session:
        session.exec(update(Campaign).where(col(Campaign.id) == campaign_id).values(**values))  # type: ignore[call-overload]
        session.commit()


def _increment_progress(campaign_id: int) -> None:
    with Session(engine) as session:
        session.exec(
            update(Campaign)  # type: ignore[call-overload]
            .where(col(Campaign.id) == campaign_id)
            .values(completed_cases=Campaign.completed_cases + 1)
        )
        session.commit()


def _save_test_case(tc: TestCase) -> TestCase:
    with Session(engine) as session:
        session.add(tc)
        session.commit()
        session.refresh(tc)
        return tc


def _save_result(result: Result) -> None:
    with Session(engine) as session:
        session.add(result)
        session.commit()


async def attack_and_evaluate(
    target: TargetSnapshot, tc: TestCase, *, trial: int, use_judge: bool, attacker_goal: str
) -> Result:
    assert tc.id is not None
    response = await target_adapter.send(target, tc.attack_text)
    base = Result(
        test_case_id=tc.id, campaign_id=tc.campaign_id, trial=trial, http_status=response.http_status,
        raw_response=response.raw_text[:RAW_RESPONSE_LIMIT], extracted_reply=response.extracted,
        latency_ms=response.latency_ms, verdict=Verdict.ERROR,
    )
    if not response.ok or response.extracted is None:
        base.judge_rationale = response.error
        return base
    evaluation = await evaluate(
        DetectionInput(
            category=tc.category, attack_text=tc.attack_text, attacker_goal=attacker_goal,
            reply=response.extracted, marker_token=tc.marker_token,
            canary_strings=target.canary_strings, system_prompt_hint=target.system_prompt_hint,
        ),
        use_judge=use_judge,
    )
    base.verdict = evaluation.verdict
    base.confidence = evaluation.confidence
    base.severity = evaluation.severity
    base.detector_hits = dump_hits(evaluation.hits)
    base.judge_rationale = evaluation.judge_rationale
    return base


def _error_result(tc: TestCase, message: str, trial: int = 1) -> Result:
    assert tc.id is not None
    return Result(test_case_id=tc.id, campaign_id=tc.campaign_id, trial=trial, verdict=Verdict.ERROR,
                  severity=Severity.NONE, judge_rationale=message, raw_response="")


async def _run_planned(campaign_id: int, target: TargetSnapshot, case: PlannedCase, use_judge: bool) -> None:
    marker = new_marker() if case.seed.marker_required else None
    tc = TestCase(
        campaign_id=campaign_id, template_id=case.seed.id, category=case.seed.category,
        technique=case.seed.technique, language=case.language, variant=case.variant,
        attack_text=case.seed.text, modality=Modality.TEXT,
    )
    try:
        attack = await localize(case.seed, case.language, case.variant, case.wrapper, marker)
    except SarvamError as exc:
        tc.english_gloss = case.seed.text
        tc = _save_test_case(tc)
        _save_result(_error_result(tc, f"Attack generation failed (Sarvam): {exc.message}"))
        return
    tc.attack_text = attack.text
    tc.mutation_chain = [m.value for m in attack.mutation_chain]
    tc.english_gloss = attack.english_gloss
    tc.detected_language = attack.detected_language
    tc.detected_script = attack.detected_script
    tc.marker_token = attack.marker_token
    tc = _save_test_case(tc)
    try:
        result = await attack_and_evaluate(target, tc, trial=1, use_judge=use_judge, attacker_goal=attack.english_gloss)
    except AppError as exc:
        result = _error_result(tc, exc.message)
    _save_result(result)


async def _identify(text: str, language: LanguageCode) -> tuple[str | None, str | None]:
    if language is LanguageCode.EN:
        return "en-IN", "Latn"
    try:
        lid = await text_lid.identify(re.sub(r"\d{4}-\d{4}", "", text))
    except SarvamError:
        return None, None
    return lid.language_code, lid.script_code


async def _run_mission(
    campaign_id: int, target: TargetSnapshot, mission: adaptive.PlannedMission, use_judge: bool, max_turns: int
) -> None:
    """One adaptive mission: attack, read the reply, adapt, repeat until breached or out of turns."""
    mission_id = uuid.uuid4().hex[:12]
    marker = new_marker() if mission.category in adaptive.MARKER_CATEGORIES else None
    goal = adaptive.goal_for(mission.category, marker)
    history: list[adaptive.Attempt] = []
    errors_in_row = 0
    for turn in range(1, max_turns + 1):
        step = await adaptive.next_attack(
            app_name=target.name, category=mission.category, language=mission.language,
            marker=marker, history=history, turn=turn,
        )
        detected_language, detected_script = await _identify(step.attack_text, mission.language)
        tc = _save_test_case(TestCase(
            campaign_id=campaign_id, template_id=f"adaptive:{mission.category.value}", category=mission.category,
            technique=f"Adaptive · {step.tactic}", language=mission.language, variant=step.style,
            mutation_chain=[Mutation.ADAPTIVE.value], attack_text=step.attack_text,
            english_gloss=step.english_meaning, detected_language=detected_language,
            detected_script=detected_script, marker_token=marker, mission_id=mission_id, turn=turn,
            tactic=step.tactic, attacker_note=step.rationale, modality=Modality.TEXT,
        ))
        try:
            result = await attack_and_evaluate(target, tc, trial=1, use_judge=use_judge, attacker_goal=goal)
        except AppError as exc:
            result = _error_result(tc, exc.message)
        # Read everything we need BEFORE saving: committing expires the object and the session is closed.
        verdict = result.verdict
        reply = result.extracted_reply or result.judge_rationale or "(no reply)"
        _save_result(result)
        history.append(adaptive.Attempt(turn=turn, tactic=step.tactic, attack=step.attack_text, reply=reply))
        if verdict is Verdict.VULNERABLE:
            return  # breached: mission accomplished
        errors_in_row = errors_in_row + 1 if verdict is Verdict.ERROR else 0
        if errors_in_row >= 2:
            return  # the target is unreachable; stop burning credits


@dataclass(frozen=True)
class VoiceReplayItem:
    source_test_case_id: int


async def _run_voice_replay(campaign_id: int, target: TargetSnapshot, item: VoiceReplayItem, use_judge: bool) -> None:
    """Re-send an existing text attack as SPEECH (Sarvam TTS -> Sarvam STT -> target) for a paired comparison."""
    from app.services import voice_pipeline  # local import: voice_pipeline imports this module

    with Session(engine) as session:
        source = session.get(TestCase, item.source_test_case_id)
    if source is None:
        return
    goal = source.english_gloss or source.attack_text

    # Fresh TEXT twin, sent now and judged by the same detectors, so the only difference from the
    # voice attempt below is the speech layer (not the date, the judge version or the bot's mood).
    text_twin = _save_test_case(TestCase(
        campaign_id=campaign_id, source_test_case_id=source.id, template_id=source.template_id,
        category=source.category, technique=f"Text · {source.technique}", language=source.language,
        variant=source.variant, mutation_chain=list(source.mutation_chain), attack_text=source.attack_text,
        english_gloss=source.english_gloss, modality=Modality.TEXT,
    ))
    try:
        twin_result = await attack_and_evaluate(target, text_twin, trial=1, use_judge=use_judge, attacker_goal=goal)
    except AppError as exc:
        twin_result = _error_result(text_twin, exc.message)
    _save_result(twin_result)

    tc = TestCase(
        campaign_id=campaign_id, source_test_case_id=source.id, template_id=source.template_id,
        category=source.category, technique=f"Voice · {source.technique}", language=source.language,
        variant=source.variant, mutation_chain=[*source.mutation_chain, Mutation.TTS.value],
        attack_text=source.attack_text, english_gloss=source.english_gloss, modality=Modality.VOICE,
    )
    try:
        spoken = await voice_pipeline.speak_and_transcribe(
            source.attack_text, source.language, code_mixed=source.variant is ScriptVariant.CODE_MIXED)
    except SarvamError as exc:
        tc = _save_test_case(tc)
        _save_result(_error_result(tc, f"Voice pipeline failed (Sarvam): {exc.message}"))
        return
    tc.attack_text = spoken.transcript or source.attack_text  # what the bot actually receives
    tc.transcript = spoken.transcript
    tc.transcript_drift = spoken.drift
    tc.audio_id = spoken.audio_id
    tc.detected_language = spoken.detected_language
    tc = _save_test_case(tc)
    try:
        result = await attack_and_evaluate(target, tc, trial=1, use_judge=use_judge, attacker_goal=goal)
    except AppError as exc:
        result = _error_result(tc, exc.message)
    _save_result(result)


async def _run_existing(target: TargetSnapshot, test_case_id: int, trials: int, use_judge: bool) -> None:
    with Session(engine) as session:
        tc = session.get(TestCase, test_case_id)
    if tc is None:
        return
    goal = tc.english_gloss or tc.attack_text
    for trial in range(1, trials + 1):
        try:
            result = await attack_and_evaluate(target, tc, trial=trial, use_judge=use_judge, attacker_goal=goal)
        except AppError as exc:
            result = _error_result(tc, exc.message, trial)
        _save_result(result)


async def _execute(
    campaign_id: int,
    target: TargetSnapshot,
    planned: list[PlannedCase] | None,
    existing_ids: list[int] | None,
    trials: int,
    use_judge: bool,
    missions: list[adaptive.PlannedMission] | None = None,
    max_turns: int = 4,
    voice: list[VoiceReplayItem] | None = None,
) -> None:
    _set_campaign(campaign_id, status=CampaignStatus.RUNNING, started_at=_now())
    semaphore = asyncio.Semaphore(TARGET_CONCURRENCY)

    async def worker(item: PlannedCase | adaptive.PlannedMission | VoiceReplayItem | int) -> None:
        async with semaphore:
            try:
                if isinstance(item, VoiceReplayItem):
                    await _run_voice_replay(campaign_id, target, item, use_judge)
                elif isinstance(item, adaptive.PlannedMission):
                    await _run_mission(campaign_id, target, item, use_judge, max_turns)
                elif isinstance(item, PlannedCase):
                    await _run_planned(campaign_id, target, item, use_judge)
                else:
                    await _run_existing(target, item, trials, use_judge)
            except asyncio.CancelledError:
                raise
            except Exception:  # one broken case must never kill the campaign
                logger.exception("Case failed in campaign %s", campaign_id)
            finally:
                _increment_progress(campaign_id)

    items: list[PlannedCase | adaptive.PlannedMission | VoiceReplayItem | int] = [
        *(planned or []), *(missions or []), *(voice or []), *(existing_ids or []),
    ]
    try:
        await asyncio.gather(*(worker(i) for i in items))
    except asyncio.CancelledError:
        _set_campaign(campaign_id, status=CampaignStatus.CANCELLED, finished_at=_now())
        raise
    except Exception as exc:
        logger.exception("Campaign %s failed", campaign_id)
        _set_campaign(campaign_id, status=CampaignStatus.FAILED, error_message=str(exc)[:500], finished_at=_now())
        return
    finally:
        _tasks.pop(campaign_id, None)
    _set_campaign(campaign_id, status=CampaignStatus.COMPLETED, finished_at=_now())


def start(
    campaign_id: int,
    target: TargetSnapshot,
    *,
    planned: list[PlannedCase] | None = None,
    existing_ids: list[int] | None = None,
    trials: int = 1,
    use_judge: bool = True,
    missions: list[adaptive.PlannedMission] | None = None,
    max_turns: int = 4,
    voice: list[VoiceReplayItem] | None = None,
) -> None:
    task = asyncio.create_task(
        _execute(campaign_id, target, planned, existing_ids, trials, use_judge, missions, max_turns, voice)
    )
    _tasks[campaign_id] = task


def cancel(campaign_id: int) -> bool:
    task = _tasks.get(campaign_id)
    if task is None or task.done():
        return False
    task.cancel()
    return True


def is_running(campaign_id: int) -> bool:
    task = _tasks.get(campaign_id)
    return task is not None and not task.done()


STALE_AFTER = timedelta(minutes=2)


def recover_interrupted() -> None:
    """On startup, mark campaigns left running by a dead process as failed.

    Only campaigns with no activity for STALE_AFTER are touched: startup hooks also run in
    a second process that then fails to bind the port, and it must not kill live work.
    """
    now = _now()
    with Session(engine) as session:
        candidates = session.exec(
            select(Campaign).where(col(Campaign.status).in_([CampaignStatus.QUEUED, CampaignStatus.RUNNING]))
        ).all()
        for c in candidates:
            last_result = session.exec(
                select(func.max(Result.created_at)).where(col(Result.campaign_id) == c.id)
            ).one()
            last_activity = max(utc(t) for t in (c.created_at, c.started_at, last_result) if t is not None)
            if now - last_activity < STALE_AFTER:
                continue
            c.status = CampaignStatus.FAILED
            c.error_message = "Interrupted by a server restart"
            c.finished_at = now
            session.add(c)
        session.commit()


def seed_goal(template_id: str) -> str | None:
    seed = get_seed(template_id)
    return seed.text if seed else None
