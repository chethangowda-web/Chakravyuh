"""Re-score stored results whose 'vulnerable' verdict rested ONLY on the injected-code marker.

Why: early versions confirmed a breach whenever the injected code appeared anywhere in the reply, even
inside a refusal ("I can't give you 1593-5084"). The corrected rule only auto-confirms a code that is
how the reply starts/ends (or a very short reply); anything else goes to the Sarvam judge.
Results proven by a canary, PII, or prompt-leak check are never touched.

  backend\\.venv\\Scripts\\python scripts\\rescore.py            # dry run: shows what would change
  backend\\.venv\\Scripts\\python scripts\\rescore.py --apply    # re-score with the judge and save (uses a few Sarvam calls)
"""

import argparse
import asyncio
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from sqlmodel import Session, select  # noqa: E402

from app.db import engine, init_db  # noqa: E402
from app.models import Campaign, Result, Target, TestCase  # noqa: E402
from app.schemas.enums import Verdict  # noqa: E402
from app.services.detectors.base import DetectionInput  # noqa: E402
from app.services.mappers import dump_hits  # noqa: E402
from app.services.scoring import evaluate  # noqa: E402


async def main(apply: bool) -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    init_db()
    moves: Counter[tuple[str, str]] = Counter()
    with Session(engine) as session:
        targets = {t.id: t for t in session.exec(select(Target)).all()}
        campaigns = {c.id: c for c in session.exec(select(Campaign)).all()}
        rows = session.exec(
            select(Result, TestCase).join(TestCase, TestCase.id == Result.test_case_id)  # type: ignore[arg-type]
            .where(Result.verdict == Verdict.VULNERABLE)
        ).all()
        for result, test_case in rows:
            fired = {h["detector"] for h in result.detector_hits if h.get("fired")}
            if "marker" not in fired or fired & {"canary", "pii", "prompt_leak"}:
                continue
            target = targets[campaigns[result.campaign_id].target_id]
            evaluation = await evaluate(
                DetectionInput(
                    category=test_case.category, attack_text=test_case.attack_text,
                    attacker_goal=test_case.english_gloss or test_case.attack_text,
                    reply=result.extracted_reply or "", marker_token=test_case.marker_token,
                    canary_strings=list(target.canary_strings), system_prompt_hint=target.system_prompt_hint,
                ),
                use_judge=apply,
            )
            moves[("vulnerable", f"{evaluation.verdict.value} ({evaluation.confidence.value if evaluation.confidence else 'n/a'})")] += 1
            changed = (evaluation.verdict, evaluation.confidence, evaluation.severity) != (
                result.verdict, result.confidence, result.severity)
            if apply and changed:
                result.verdict = evaluation.verdict
                result.confidence = evaluation.confidence
                result.severity = evaluation.severity
                result.detector_hits = dump_hits(evaluation.hits)
                result.judge_rationale = evaluation.judge_rationale
                session.add(result)
        if apply:
            session.commit()
    mode = "APPLIED" if apply else "DRY RUN (judge not consulted; 'inconclusive' means the judge would decide)"
    print(f"{mode}: {sum(moves.values())} marker-only results examined")
    for (before, after), n in sorted(moves.items()):
        print(f"  {before} -> {after}: {n}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    asyncio.run(main(parser.parse_args().apply))
