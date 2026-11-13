"""Prepare the adaptive-attacker + auto-fix demo on your REAL data (uses Sarvam credits, ~4 minutes).

  1. makes sure the demo target has its fix webhook set
  2. runs an adaptive campaign against the vulnerable bot (v1)
  3. applies Sarvam-written fixes (up to --rounds) and reruns the attacks after each
  4. RESTORES the bot to v1 and the target's stored prompt, so the demo can be run again live

Usage (backend :8010 and demo bot :8100 running):
  backend\\.venv\\Scripts\\python scripts\\prepare_demo.py [--rounds 2] [--no-fix]
"""

import argparse
import sys
import time

import httpx

API = "http://127.0.0.1:8010/api/v1"
DEMO = "http://127.0.0.1:8100"


def wait(client: httpx.Client, campaign_id: int, label: str) -> dict:
    while True:
        c = client.get(f"/campaigns/{campaign_id}").raise_for_status().json()
        print(f"  [{label}] {c['status']:9} {c['completed_cases']}/{c['total_cases']}  vulnerable={c['counts']['vulnerable']}")
        if c["status"] not in ("queued", "running"):
            return c
        time.sleep(5)


def wait_helpfulness(client: httpx.Client, fix_id: int, phase: str) -> None:
    while True:
        check = client.get(f"/fixes/{fix_id}").raise_for_status().json()[f"helpfulness_{phase}"]
        if check is None or check["status"] not in ("queued", "running"):
            return
        print(f"  [helpfulness {phase}] measuring legitimate questions...")
        time.sleep(5)


def report(client: httpx.Client, regression_id: int, fix_id: int) -> None:
    run = client.get(f"/regression/{regression_id}").json()
    g = run["generalization"]
    if g:
        print(f"  generalization: fix set {g['fix_set_total']} -> {g['fix_set_still_vulnerable']} still succeeding, "
              f"UNSEEN attacks {g['heldout_total']} -> {g['heldout_still_vulnerable']}")
    fix = client.get(f"/fixes/{fix_id}").json()
    before, after = fix["helpfulness_before"], fix["helpfulness_after"]
    if before and after and before["answer_rate"] is not None and after["answer_rate"] is not None:
        print(f"  helpfulness (legitimate questions answered): {before['answer_rate']:.0%} -> {after['answer_rate']:.0%}")


def put_target(client: httpx.Client, target: dict, **changes: object) -> dict:
    body = {k: target[k] for k in ("name", "kind", "base_url", "method", "body_template", "response_path",
                                   "canary_strings", "system_prompt_hint", "fix_webhook_url")}
    body.update(changes)
    body["headers"] = None  # keep stored headers
    return client.put(f"/targets/{target['id']}", json=body).raise_for_status().json()


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    parser = argparse.ArgumentParser()
    parser.add_argument("--rounds", type=int, default=2)
    parser.add_argument("--turns", type=int, default=4, help="attempts per mission (more = more chances to adapt)")
    parser.add_argument("--no-fix", action="store_true")
    args = parser.parse_args()

    httpx.post(f"{DEMO}/admin/version", json={"version": "v1"}).raise_for_status()
    with httpx.Client(base_url=API, timeout=300) as client:
        targets = client.get("/targets").raise_for_status().json()["items"]
        target = next((t for t in targets if t["verification_status"] == "verified" and "8100" in t["base_url"]), None)
        if target is None:
            raise SystemExit("No verified demo target on :8100. Create it first (Targets > Fill BharatBank demo).")
        original_prompt = target["system_prompt_hint"]
        if target["fix_webhook_url"] != f"{DEMO}/admin/prompt":
            target = put_target(client, target, fix_webhook_url=f"{DEMO}/admin/prompt")
            print("Set the fix webhook on", target["name"])

        try:
            config = {
                "mode": "adaptive", "max_turns": args.turns, "use_judge": True, "variants": ["native"],
                "categories": ["sensitive_data_leak", "system_prompt_extraction", "instruction_override",
                               "harmful_content"],
                "languages": ["en-IN", "hi-IN", "kn-IN"],
            }
            campaign = client.post("/campaigns", json={"target_id": target["id"], "name": "Adaptive attacker demo",
                                                       "config": config}).raise_for_status().json()
            print(f"Adaptive campaign #{campaign['id']} started")
            done = wait(client, campaign["id"], "attack")
            missions = client.get(f"/campaigns/{campaign['id']}/missions").json()
            print(f"Missions breached: {missions['breached']}/{missions['total']}")

            current = campaign["id"]
            if not args.no_fix and done["counts"]["vulnerable"] > 0:
                for round_number in range(1, args.rounds + 1):
                    if client.get(f"/campaigns/{current}").json()["counts"]["vulnerable"] == 0:
                        break
                    fix = client.post(f"/campaigns/{current}/fixes").raise_for_status().json()
                    print(f"Fix {round_number}: {fix['summary'][:140]}")
                    print(f"  patch written from {fix['fix_set_size']} attacks; {fix['heldout_set_size']} held out")
                    wait_helpfulness(client, fix["id"], "before")
                    applied = client.post(f"/fixes/{fix['id']}/apply", json={"via": "webhook", "trials": 1}).raise_for_status().json()
                    run = client.get(f"/regression/{applied['regression_id']}").json()
                    wait(client, run["new_campaign_id"], f"rerun {round_number}")
                    wait_helpfulness(client, fix["id"], "after")  # must finish before the bot is reset
                    report(client, applied["regression_id"], fix["id"])
                    current = run["new_campaign_id"]
                for step in client.get(f"/campaigns/{campaign['id']}/hardening").json()["steps"]:
                    print(f"  {step['label']:12} attacks still succeeding: {step['vulnerable']}")
        finally:
            # Leave the system exactly as a fresh demo expects: vulnerable bot, original prompt on record.
            httpx.post(f"{DEMO}/admin/version", json={"version": "v1"})
            fresh = client.get(f"/targets/{target['id']}").json()
            put_target(client, fresh, system_prompt_hint=original_prompt)
            print("Restored the demo bot to v1 and the target's original prompt.")


if __name__ == "__main__":
    main()
