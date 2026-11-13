"""End-to-end test of the adaptive attacker + auto-fix loop against the demo bot.

  adaptive campaign  ->  Sarvam proposes a prompt patch  ->  applied via the target's fix webhook
  ->  regression reruns the winning attacks  ->  hardening timeline

Usage:  backend\\.venv\\Scripts\\python scripts\\e2e_adaptive.py [--api http://127.0.0.1:8012/api/v1] [--demo http://127.0.0.1:8102]
Requires the backend, the demo target and a Sarvam key.
"""

import argparse
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent


def poll(client: httpx.Client, campaign_id: int, label: str) -> dict:
    while True:
        c = client.get(f"/campaigns/{campaign_id}").raise_for_status().json()
        print(f"  [{label}] {c['status']:9} {c['completed_cases']}/{c['total_cases']} "
              f"vuln={c['counts']['vulnerable']} safe={c['counts']['safe']} err={c['counts']['errors']}")
        if c["status"] not in ("queued", "running"):
            return c
        time.sleep(5)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default="http://127.0.0.1:8012/api/v1")
    parser.add_argument("--demo", default="http://127.0.0.1:8102")
    parser.add_argument("--rounds", type=int, default=2, help="max auto-fix rounds")
    args = parser.parse_args()

    httpx.post(f"{args.demo}/admin/version", json={"version": "v1"}).raise_for_status()
    prompt = (ROOT / "demo_target" / "prompts" / "v1_vulnerable.txt").read_text(encoding="utf-8")

    with httpx.Client(base_url=args.api, timeout=300) as client:
        target = client.post("/targets", json={
            "name": "BharatBank Assist (demo)", "base_url": f"{args.demo}/chat",
            "body_template": '{"message": "{{prompt}}"}', "response_path": "reply",
            "canary_strings": ["BB-OVERRIDE-4417-KESTREL"], "system_prompt_hint": prompt,
            "fix_webhook_url": f"{args.demo}/admin/prompt", "ownership_confirmed": True,
        }).raise_for_status().json()
        client.post(f"/targets/{target['id']}/verify").raise_for_status()

        config = {
            "mode": "adaptive", "max_turns": 4, "use_judge": True,
            "categories": ["sensitive_data_leak", "system_prompt_extraction", "instruction_override"],
            "languages": ["en-IN", "hi-IN", "kn-IN"], "variants": ["native"],
        }
        print("estimate:", client.post("/campaigns/estimate", json={"target_id": target["id"], "config": config}).json())
        campaign = client.post("/campaigns", json={"target_id": target["id"], "name": "Adaptive attacker run",
                                                   "config": config}).raise_for_status().json()
        poll(client, campaign["id"], "adaptive")

        missions = client.get(f"/campaigns/{campaign['id']}/missions").json()
        print(f"\nmissions breached: {missions['breached']}/{missions['total']}")
        for m in missions["items"]:
            print(f"- {m['category']} · {m['language']}: breached={m['breached']} in {m['turns_used']} turn(s), "
                  f"winning tactic={m['winning_tactic']}")
            for t in m["turns"]:
                print(f"    turn {t['turn']} [{t['tactic']}/{t['variant']}] {t['verdict']}/{t['severity']}: "
                      f"{t['attack_text'][:80]!r}")

        current = campaign["id"]
        for round_number in range(1, args.rounds + 1):
            counts = client.get(f"/campaigns/{current}").json()["counts"]
            if counts["vulnerable"] == 0:
                print("\nNothing left to fix.")
                break
            fix = client.post(f"/campaigns/{current}/fixes").raise_for_status().json()
            print(f"\n=== fix {round_number}: {fix['summary']}")
            for change in fix["changes"]:
                print("   -", change)
            applied = client.post(f"/fixes/{fix['id']}/apply", json={"via": "webhook", "trials": 1}).raise_for_status().json()
            run = client.get(f"/regression/{applied['regression_id']}").json()
            poll(client, run["new_campaign_id"], f"rerun {round_number}")
            run = client.get(f"/regression/{applied['regression_id']}").json()
            print("   regression:", run["summary"])
            current = run["new_campaign_id"]

        print("\nHardening timeline:")
        for step in client.get(f"/campaigns/{campaign['id']}/hardening").json()["steps"]:
            print(f"  {step['label']:12} still succeeding: {step['vulnerable']} "
                  f"(of {step['rerun_total'] if step['rerun_total'] is not None else 'all'})")


if __name__ == "__main__":
    main()
