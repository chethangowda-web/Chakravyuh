"""Read model for adaptive-attacker missions (a timeline of attempts per goal)."""

from collections import defaultdict

from sqlmodel import Session, col, select

from app.models import Result, TestCase
from app.schemas.adaptive import MissionList, MissionOut, MissionTurn
from app.schemas.enums import Verdict
from app.services.attack_engine.adaptive import goal_for
from app.services.campaigns import get_campaign_or_404

_EXCERPT = 320


def list_missions(session: Session, campaign_id: int) -> MissionList:
    get_campaign_or_404(session, campaign_id)
    rows = session.exec(
        select(TestCase, Result)
        .join(Result, col(Result.test_case_id) == col(TestCase.id))
        .where(col(TestCase.campaign_id) == campaign_id, col(TestCase.mission_id).is_not(None))
        .order_by(col(TestCase.id))
    ).all()

    grouped: dict[str, list[tuple[TestCase, Result]]] = defaultdict(list)
    for test_case, result in rows:
        assert test_case.mission_id is not None
        grouped[test_case.mission_id].append((test_case, result))

    missions: list[MissionOut] = []
    for mission_id, attempts in grouped.items():
        first = attempts[0][0]
        winner = next((tc for tc, r in attempts if r.verdict is Verdict.VULNERABLE), None)
        missions.append(MissionOut(
            mission_id=mission_id, category=first.category, language=first.language,
            goal=goal_for(first.category, first.marker_token), breached=winner is not None,
            turns_used=len(attempts), winning_tactic=winner.tactic if winner else None,
            turns=[
                MissionTurn(
                    result_id=r.id or 0, turn=tc.turn or index, tactic=tc.tactic, variant=tc.variant,
                    attack_text=tc.attack_text, english_meaning=tc.english_gloss, attacker_note=tc.attacker_note,
                    reply_excerpt=(r.extracted_reply or r.judge_rationale or "")[:_EXCERPT] or None,
                    verdict=r.verdict, confidence=r.confidence, severity=r.severity,
                )
                for index, (tc, r) in enumerate(attempts, start=1)
            ],
        ))
    # Breached missions first: they are the story.
    missions.sort(key=lambda m: (not m.breached, m.category.value, m.language.value))
    return MissionList(items=missions, breached=sum(m.breached for m in missions), total=len(missions))
