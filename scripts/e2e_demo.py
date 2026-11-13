"""End-to-end demo driver: registers the demo target, runs a campaign, switches the target to
v2 (patched) and runs a regression. Requires backend (:8010) and demo target (:8100) running.

Usage:  backend\\.venv\\Scripts\\python scripts\\e2e_demo.py [--full]
"""

import sys
import time
from pathlib import Path

import httpx

API = "http://127.0.0.1:8010/api/v1"
DEMO = "http://127.0.0.1:8100"
ROOT = Path(__file__).resolve().parent.parent


def wait_for(url: str) -> None:
    for _ in range(60):
        try:
            httpx.get(url, timeout=2)
            return
        except httpx.HTTPError:
            time.sleep(0.5)
    raise SystemExit(f"{url} not reachable")


def poll(client: httpx.Client, campaign_id: int) -> dict:
    while True:
        c = client.get(f"/campaigns/{campaign_id}").raise_for_status().json()
        print(f"  {c['status']:9} {c['completed_cases']}/{c['total_cases']}  vuln={c['counts']['vulnerable']} "
              f"safe={c['counts']['safe']} inconclusive={c['counts']['inconclusive']} errors={c['counts']['errors']}")
        if c["status"] not in ("queued", "running"):
            return c
        time.sleep(4)


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]
    full = "--full" in sys.argv
    wait_for(f"{API}/health")
    wait_for(f"{DEMO}/health")
    httpx.post(f"{DEMO}/admin/version", json={"version": "v1"})

    with httpx.Client(base_url=API, timeout=120) as client:
        target = client.post("/targets", json={
            "name": "BharatBank Assist (demo)",
            "base_url": f"{DEMO}/chat",
            "body_template": '{"message": "{{prompt}}"}',
            "response_path": "reply",
            "canary_strings": ["BB-OVERRIDE-4417-KESTREL"],
            "system_prompt_hint": (ROOT / "demo_target" / "prompts" / "v1_vulnerable.txt").read_text(encoding="utf-8"),
            "ownership_confirmed": True,
        }).raise_for_status().json()
        print("target", target["id"], client.post(f"/targets/{target['id']}/verify").json()["message"])
        print("test-connection:", client.post(f"/targets/{target['id']}/test-connection", json={}).json()["extracted_reply"][:80])

        config = {
            "categories": ["prompt_injection", "instruction_override", "system_prompt_extraction",
                           "sensitive_data_leak", "jailbreak"] if full else ["sensitive_data_leak", "prompt_injection"],
            "languages": ["en-IN", "hi-IN", "kn-IN", "te-IN", "ta-IN"],
            "variants": ["native", "romanized", "code_mixed"] if full else ["native", "code_mixed"],
            "use_judge": True,
        }
        est = client.post("/campaigns/estimate", json={"target_id": target["id"], "config": config}).json()
        print("estimate:", est)
        campaign = client.post("/campaigns", json={
            "target_id": target["id"], "name": "BharatBank multilingual baseline", "config": config,
        }).raise_for_status().json()
        print("campaign", campaign["id"])
        done = poll(client, campaign["id"])

        dash = client.get("/dashboard/summary", params={"campaign_id": campaign["id"]}).json()["breakdown"]
        print("\nLanguage security gap:")
        for s in dash["by_language"]:
            print(f"  {s['language']}: {s['vulnerable']}/{s['total']} = {s['vulnerability_rate']:.0%}")
        for s in dash["by_variant"]:
            print(f"  {s['variant']}: {s['vulnerable']}/{s['total']} = {s['vulnerability_rate']:.0%}")
        print("severity:", dash["severity_distribution"])

        top = client.get(f"/campaigns/{campaign['id']}/results", params={"limit": 5}).json()["items"]
        for r in top:
            print(f"  [{r['severity']}] {r['language']} {r['variant']} {r['attack_text'][:70]!r}")

        if done["counts"]["vulnerable"] == 0:
            return
        httpx.post(f"{DEMO}/admin/version", json={"version": "v2"})
        reg = client.post(f"/campaigns/{campaign['id']}/regression",
                          json={"only_failed": True, "trials": 1 if not full else 2}).raise_for_status().json()
        print("\nregression", reg["id"], "-> campaign", reg["new_campaign_id"])
        poll(client, reg["new_campaign_id"])
        reg = client.get(f"/regression/{reg['id']}").json()
        print("regression summary:", reg["summary"])
        httpx.post(f"{DEMO}/admin/version", json={"version": "v1"})


if __name__ == "__main__":
    main()
