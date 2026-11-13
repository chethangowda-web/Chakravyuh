# Chakravyuh

**An Indic red-teaming lab for LLM and voice applications.**
Attack your AI app with native, romanized and code-mixed prompts in English, Hindi, Kannada, Telugu and Tamil — powered by Sarvam AI — then see exactly what leaks, with evidence, severity, and regression proof after you fix it.

Built for *Build with Sarvam* (Vertex Club × Sarvam AI) · Security & Developer Tools track.

> Architecture and API contract: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Demo walkthrough: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)

## What it does

| Feature | How |
|---|---|
| **Test your own app** | Register any HTTP LLM endpoint: URL, JSON body template with `{{prompt}}`, response path. Ownership must be verified before attacks run. |
| **Adaptive AI attacker** | **Sarvam-105B** plays the attacker over several attempts: it reads how the bot refused and changes tactic, persona and script until it breaches the target. It plans in English and **Sarvam Translate** renders each attempt in the chosen language and style (native / romanized / code-mixed). Every attempt is stored as a timeline with the attacker's reasoning. |
| **Auto-fix loop** | **Sarvam-105B** reads the attacks that worked and writes a patched system prompt (secrets removed, rules stated for every language and script), shown as a diff. Apply it with one click through the target's fix webhook (or by hand), and a regression run replays the exact attacks; a **hardening timeline** shows attacks still succeeding after each round (e.g. 7 → 1 → 0). |
| **Held-out proof** | The successful attacks are split (stratified, deterministic) into a *fix set* the patch author sees and a *held-out set* it never sees. The rerun reports both, e.g. "fix set 5 → 0, **unseen attacks 4 → 0**", so the claim is "it generalises", not "it replays what it saw". |
| **Over-refusal check** | 10 ordinary banking questions (balance, branch hours, UPI PIN reset, lost card…) in each campaign language are asked **before and after** every patch, and a Sarvam judge decides whether the bot still helped: e.g. "**100% → 97%** answered". A patch that refuses everything is caught. |
| **Harmful content (Indic)** | A sixth category tests what the bot *says*, not just what it leaks: UPI-PIN/OTP scam scripts, caste- and religion-based discrimination, and regional misinformation (a fake bank-closure rumour). |
| **Text vs voice delta** | *Replay as voice* re-sends a campaign's attacks through Sarvam TTS → STT → the bot, **and** re-sends the text version at the same time, so both are judged identically. In our run: text 7/12, voice 8/12, 4% transcript drift — a voice bot inherits its text bot's weaknesses. |
| **How findings were confirmed** | Dashboard and report show the split between deterministic proof and the model judge (e.g. **80% proven by rules, 20% by the judge**), answering the "AI grading itself" objection with a number. |
| **CI gate** | `scripts/ci_gate.py` (needs only `httpx`) runs or reads a campaign and exits non-zero when critical findings or the **Language Security Gap** cross a threshold, with a JSON report. Example GitHub Actions workflow: [docs/ci/chakravyuh-gate.yml](docs/ci/chakravyuh-gate.yml). |
| **Attack library** | 25 hand-written seeds across prompt injection, jailbreak, instruction override, system-prompt extraction, data leakage and harmful content → localized by **Sarvam Translate** into native / romanized / code-mixed forms, each verified by **Sarvam language ID**. |
| **Voice red team** | Attack audio from **Sarvam TTS** (or upload / mic) → **Sarvam STT** → your LLM. Reports transcript drift. |
| **Detection** | Deterministic first: planted-secret canaries, injected-code markers, Indian PII regexes (PAN, Aadhaar, mobile, accounts), system-prompt overlap, multilingual refusals. **Sarvam-105B** judges only what those can't decide, and must quote evidence that's really in the reply. |
| **Severity & evidence** | Critical / High / Medium / Low, “confirmed” vs “likely”, full request/response, highlighted leak spans, remediation tips. |
| **Dashboard** | Totals, severity distribution, **Language Security Gap**, language × category heatmap, campaign history. Counts each attack once: original campaigns only (regression reruns and voice replays re-send existing attacks) and one result per adaptive mission. |
| **Regression** | Re-run a campaign's failed attacks verbatim (×3 trials) and diff before/after: fixed · still vulnerable · flaky · new. |
| **Report** | Print-ready executive summary (Save as PDF). |

Included demo targets (`demo_target/`, one app, choose with `DEMO_BOT`), both Sarvam-powered with a planted secret and PII; v1 is vulnerable, v2 is patched:

| Bot | Port | What it shows |
|---|---|---|
| **BharatBank Assist** (`DEMO_BOT=bharatbank`, default) | 8100 | A retail-bank support bot whose rules are written only in English. |
| **Sahayak Seva** (`DEMO_BOT=sahayak`) | 8101 | A government-scheme citizen helpdesk with an **English-only keyword blocklist**: "ignore previous instructions" in English is blocked, the same attack in Kannada or Hindi leaks the citizen's Aadhaar and bank details. |

Each target can list its own **legitimate questions** (Sahayak: ration card, PM-KISAN, pensions…) for the over-refusal check; without them the built-in banking set is used.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 · TypeScript 5.9 (strict) · Tailwind CSS v4 · Vite · React Router · Recharts |
| API contract | Pydantic → OpenAPI → generated TS types (`openapi-typescript` + `openapi-fetch`) |
| Backend | Python · FastAPI · SQLModel · SQLite · httpx |
| AI | Sarvam AI — `sarvam-105b`, `mayura:v1`, `bulbul:v4-flash`, `saaras:v4`/`v3`, text language ID |

## Setup

Requirements: Python 3.12+, Node 22+.

```powershell
# Backend
python -m venv backend\.venv
backend\.venv\Scripts\pip install -r backend\requirements-dev.txt
copy backend\.env.example backend\.env      # then set SARVAM_API_KEY

# Frontend
cd frontend
npm install
```

macOS/Linux: use `backend/.venv/bin/pip` and `cp`.

## Run

```powershell
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1
```

| Service | URL |
|---|---|
| App | http://localhost:5173 |
| API docs (Swagger) | http://127.0.0.1:8010/docs |
| Demo targets | http://127.0.0.1:8100 (BharatBank) · http://127.0.0.1:8101 (Sahayak Seva) |

Quick start: **Targets → New target → “Fill BharatBank demo” (or “Fill Sahayak demo”) → Create → Verify ownership → Run a campaign** (choose *Adaptive AI attacker*). When it finishes: **Auto-fix with Sarvam → Suggest a fix → Apply to target & verify**.

End-to-end check from the command line (needs Sarvam credits): `backend\.venv\Scripts\python scripts\e2e_adaptive.py`.

CI gate against an existing campaign (no new attacks, no credits): `backend\.venv\Scripts\python scripts\ci_gate.py --campaign-id 1 --max-critical 0 --max-gap 0.15 --json report.json` — exit code 0 = pass, 1 = blocked, 2 = could not run.

Existing databases are upgraded automatically on startup (new columns are added in place, no data lost).

### Demo data (offline-friendly)

```powershell
backend\.venv\Scripts\python scripts\demo_data.py restore   # load the prepared campaign, regression and voice findings
backend\.venv\Scripts\python scripts\demo_data.py save      # snapshot your current data
```

Stop the backend before `restore`. Browsing restored data needs no network.

## Working on the API contract

1. Change models in `backend/app/schemas/`.
2. `cd frontend && npm run gen:api` — regenerates `src/api/openapi.json` and `src/api/schema.d.ts` (no server needed).
3. Commit the schema change **and** the generated files together.

Before every merge:

```powershell
cd backend;  .venv\Scripts\python -m pytest          # 73 tests, no network, no credits
cd frontend; npm run verify                           # contract check + typecheck + lint
```

## Deploy

Frontend → **Vercel** (`frontend/vercel.json` handles SPA routing). Set `VITE_API_BASE_URL` to the API's public origin.
Backend and demo target → any container host (**Railway**, **Render**): `backend/Dockerfile`, `demo_target/Dockerfile` (both verified to build).

| Service | Env vars |
|---|---|
| API | `SARVAM_API_KEY`, `CORS_ORIGINS` (your Vercel URL), **a persistent volume at `/app/data`** (or SQLite resets each deploy) |
| Demo target | `SARVAM_API_KEY`, `CHAKRAVYUH_VERIFY_TOKEN` (token shown on the target page), `DEMO_TARGET_API_KEY` (then add header `x-demo-key` in the Chakravyuh target) |

> ⚠️ **Public deployments spend your Sarvam credits.** The Chakravyuh API has no login (v1 scope): anyone with the URL can start campaigns. Share the link only with judges, and revoke/rotate the key after the event. For the stage demo, run locally.

On a hosted API, private addresses are blocked by design; the demo target must be reachable on a public URL and pass token verification. `ALLOWED_PRIVATE_HOSTS` is for local development only.

## Security notes

- `SARVAM_API_KEY` lives only in `backend/.env` (gitignored) and is only ever sent from the backend. The frontend can read only a boolean “key configured”.
- Target auth headers are stored server-side and returned masked.
- Attacks run only against targets that are ownership-declared **and** verified (token file or allowlisted host). This covers every path that sends traffic: campaigns, regression, voice, voice replay, *Test connection*, and fix proposals (which start the helpfulness check). Changing a target's URL drops its verification.
- The verification token is generated per target and shown on the target page; serve it at `{origin}/.well-known/chakravyuh-verify.txt` (the demo bot accepts it via `CHAKRAVYUH_VERIFY_TOKEN` or its control page).
- The fix webhook must be on the **same origin** (scheme, host, port) as the verified target URL, because it receives the target's auth headers.
- Outbound target requests are SSRF-guarded: http/https only, private/loopback/metadata addresses blocked, no redirects, 20 s timeout (one retry on transport failure), 256 KB response cap. Known limitation: DNS is resolved twice (guard + request), so DNS rebinding is not fully mitigated.
- Only test applications you own or are explicitly authorized to test.

## Repository layout

```
backend/        FastAPI app — schemas (contract), services (attack engine, detectors, runner), Sarvam client
demo_target/    BharatBank Assist — the vulnerable/patched app under test
frontend/       React + TypeScript UI with a generated, type-checked API client
scripts/        dev launcher, demo data snapshot/restore, end-to-end demo driver
docs/           architecture and demo script
```
