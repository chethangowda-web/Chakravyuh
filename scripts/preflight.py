"""Pre-demo check: is everything ready to present? Run it before you go on stage.

  backend\\.venv\\Scripts\\python scripts\\preflight.py            # check only
  backend\\.venv\\Scripts\\python scripts\\preflight.py --fix      # also reset any demo bot that is not on v1
  backend\\.venv\\Scripts\\python scripts\\preflight.py --live     # also send one real message through each bot and Shield

Checks: API up and Sarvam key configured, frontend up, every demo bot reachable and on v1 (the vulnerable
version the demo needs; an applied auto-fix leaves a bot on "custom"), every demo target verified, Shield copies
present, and the saved demo data (campaigns and a Shield comparison) loaded.
Exit code 0 = ready, 1 = something needs attention.
"""

import argparse
import sys
from urllib.parse import urlsplit

import httpx

OK, WARN, BAD = "\033[92m✓\033[0m", "\033[93m!\033[0m", "\033[91m✗\033[0m"
problems: list[str] = []


def line(mark: str, text: str) -> None:
    print(f" {mark} {text}")


def bad(text: str, hint: str = "") -> None:
    problems.append(text)
    line(BAD, text + (f"  → {hint}" if hint else ""))


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default="http://127.0.0.1:8010")
    parser.add_argument("--web", default="http://localhost:5173")
    parser.add_argument("--fix", action="store_true", help="reset demo bots that are not on v1")
    parser.add_argument("--live", action="store_true", help="also send one real message through each bot and Shield (uses Sarvam credits)")
    args = parser.parse_args()
    api = args.api.rstrip("/") + "/api/v1"
    client = httpx.Client(timeout=15)

    print("\nChakravyuh pre-demo check\n")
    try:
        health = client.get(f"{api}/health").json()
        line(OK, f"API is up ({health['app_name']} {health['version']})")
        if health.get("sarvam_configured"):
            line(OK, "Sarvam API key is configured")
        else:
            bad("Sarvam API key is NOT configured", "put SARVAM_API_KEY in backend/.env and restart the backend")
    except (httpx.HTTPError, KeyError, ValueError):
        bad("API is not reachable", "start everything with scripts\\dev.ps1")
        print("\nCannot continue without the API.\n")
        return 1

    try:
        line(OK if client.get(args.web).status_code == 200 else WARN, f"Website answers at {args.web}")
    except httpx.HTTPError:
        bad(f"Website is not reachable at {args.web}", "run `npm run dev` in frontend/")

    targets = client.get(f"{api}/targets").json()["items"]
    bare = [t for t in targets if t["shield_for_target_id"] is None]
    shields = {t["shield_for_target_id"]: t for t in targets if t["shield_for_target_id"] is not None}
    print("\n Demo bots")
    for t in bare:
        origin = "{0.scheme}://{0.netloc}".format(urlsplit(t["base_url"]))
        name = t["name"]
        if t["verification_status"] != "verified":
            bad(f"{name}: ownership not verified", "open the target and click Verify ownership")
        try:
            version = client.get(f"{origin}/admin/version").json().get("version")
        except (httpx.HTTPError, ValueError):
            bad(f"{name}: bot is not reachable at {origin}", "start it with scripts\\dev.ps1")
            continue
        if version == "v1":
            line(OK, f"{name}: on v1 (vulnerable, ready for the demo)")
        elif args.fix:
            client.post(f"{origin}/admin/version", json={"version": "v1"}).raise_for_status()
            line(OK, f"{name}: was '{version}', reset to v1")
        else:
            bad(f"{name}: is on '{version}', not v1 (attacks will mostly fail)", "run again with --fix")
        # An applied auto-fix overwrites the target's STORED prompt with the patched one, and resetting the bot to v1
        # does not restore it. Challenge verdicts and prompt-leak detection compare against the stored prompt, so
        # re-sync it from the bot itself whenever the bot is on v1.
        if version == "v1" or args.fix:
            try:
                live_prompt = client.get(f"{origin}/admin/prompt").json().get("system_prompt")
            except (httpx.HTTPError, ValueError):
                live_prompt = None
            if live_prompt and (t.get("system_prompt_hint") or "").strip() != live_prompt.strip():
                if args.fix:
                    body = {k: t[k] for k in ("name", "kind", "base_url", "method", "body_template", "response_path",
                                              "canary_strings", "fix_webhook_url", "legit_questions")}
                    body["system_prompt_hint"] = live_prompt
                    client.put(f"{api}/targets/{t['id']}", json=body).raise_for_status()
                    line(OK, f"{name}: stored prompt was stale (an applied fix replaces it), re-synced from the bot")
                else:
                    bad(f"{name}: stored prompt differs from the bot's real v1 prompt (an applied fix replaces it; "
                        "challenge verdicts and prompt-leak detection use it)", "run again with --fix")
        if t["id"] in shields:
            line(OK, f"{name}: Shield copy present")
        else:
            line(WARN, f"{name}: no Shield copy yet (Shield page → Protect with Shield)")
        if args.live and t["verification_status"] == "verified":
            r = client.post(f"{api}/targets/{t['id']}/test-connection", json={"prompt": "What are your working hours?"}, timeout=90).json()
            line(OK if r["ok"] else BAD, f"{name}: live reply {'in ' + str(r['latency_ms']) + ' ms' if r['ok'] else 'FAILED: ' + str(r['error'])}")
            if not r["ok"]:
                problems.append(f"{name}: live test failed")
            if r["ok"] and t["id"] in shields:
                s = client.post(f"{api}/shield/{t['id']}/chat", json={"message": "What are your working hours?"}, timeout=90)
                ok = s.status_code == 200 and s.json()["action"] == "allowed"
                line(OK if ok else BAD, f"{name}: live Shield lets a normal question through" if ok else f"{name}: Shield did not allow a normal question")
                if not ok:
                    problems.append(f"{name}: Shield live test failed")

    print("\n Saved demo data")
    summary = client.get(f"{api}/dashboard/summary").json()
    campaigns = summary["total_campaigns"]
    line(OK if campaigns >= 10 else WARN, f"{campaigns} campaigns, {summary['breakdown']['total_tests']} attacks recorded")
    for t in bare:
        if t["id"] in shields:
            cmp = client.get(f"{api}/shield/{t['id']}").json()["comparison"]
            if cmp["same_config"] and cmp["without_rate"] is not None and cmp["with_rate"] is not None:
                line(OK, f"{t['name']}: Shield comparison ready ({cmp['without_rate']:.0%} → {cmp['with_rate']:.0%})")
            else:
                line(WARN, f"{t['name']}: no like-for-like Shield comparison yet")

    print()
    if problems:
        print(f" {BAD} {len(problems)} thing(s) need attention:")
        for p in problems:
            print(f"    - {p}")
        print()
        return 1
    print(f" {OK} Ready to present.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
