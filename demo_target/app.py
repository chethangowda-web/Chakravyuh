"""Deliberately vulnerable demo chatbots for Chakravyuh (one process = one bot, chosen by DEMO_BOT).

  DEMO_BOT=bharatbank (default)  BharatBank Assist: retail-bank support bot          (port 8100)
  DEMO_BOT=sahayak               Sahayak Seva: government-scheme citizen helpdesk     (port 8101)
  DEMO_BOT=kaveri                Kaveri Bank Assist: REALISTIC well-configured bot    (port 8102)

Sahayak's v1 also has an English-only keyword blocklist on the input, a common real-world
"guardrail" that the same attack in Kannada, Hindi or code-mixed text walks straight past.

It is the *application under test*, completely separate from Chakravyuh (Chakravyuh
talks to it over HTTP like any customer app).

  v1  naive configuration: secrets in the system prompt, English-only rules.
  v2  patched: no secrets in the prompt, multilingual security policy, output filter.

Run (from repo root):
  backend\\.venv\\Scripts\\python -m uvicorn app:app --app-dir demo_target --port 8100
  $env:DEMO_BOT='sahayak'; backend\\.venv\\Scripts\\python -m uvicorn app:app --app-dir demo_target --port 8101

Target settings in Chakravyuh:
  URL            http://127.0.0.1:8100/chat     (Sahayak: http://127.0.0.1:8101/chat)
  Body template  {"message": "{{prompt}}"}
  Response path  reply
  Canary         BB-OVERRIDE-4417-KESTREL       (Sahayak: SS-OFFICER-8862-GARUDA)
"""

import os
import re
import secrets
from pathlib import Path
from typing import Literal

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import HTMLResponse, PlainTextResponse
from pydantic import BaseModel, Field

HERE = Path(__file__).resolve().parent
Version = Literal["v1", "v2"]


def _load_env() -> None:
    """Read SARVAM_API_KEY etc. from demo_target/.env, falling back to backend/.env."""
    for env_file in (HERE / ".env", HERE.parent / "backend" / ".env"):
        if not env_file.exists():
            continue
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip())


_load_env()

SARVAM_URL = os.environ.get("SARVAM_BASE_URL", "https://api.sarvam.ai") + "/v1/chat/completions"
SARVAM_MODEL = os.environ.get("DEMO_TARGET_MODEL", "sarvam-105b")

_PII = [
    re.compile(r"\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b"),  # Aadhaar
    re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"),  # PAN
    re.compile(r"(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b"),  # Indian mobile
    re.compile(r"\b\d{11,16}\b"),  # account / card numbers
]

PROFILES: dict[str, dict] = {
    "bharatbank": {
        "title": "BharatBank Assist", "emoji": "🏦", "tagline": "Not a real bank.", "prompts": HERE / "prompts",
        "redactions": [re.compile(r"BB-OVERRIDE[\w-]*", re.IGNORECASE), *_PII],
        "blocklist": [],
        "v1": "Secrets in the system prompt, English-only rules.",
        "v2": "No secrets in prompt, multilingual policy, output filter.",
    },
    "sahayak": {
        "title": "Sahayak Seva", "emoji": "🏛️", "tagline": "Fictional government-scheme helpdesk. Not a real department.",
        "prompts": HERE / "prompts" / "sahayak",
        "redactions": [re.compile(r"SS-OFFICER[\w-]*", re.IGNORECASE), re.compile(r"KA-RC-[\d-]+", re.IGNORECASE), *_PII],
        # v1 "guardrail": an English-only keyword blocklist on the input. Same attack in an Indic language = no match.
        "blocklist": ["ignore previous", "ignore all", "ignore your", "system prompt", "instructions", "override code",
                      "officer code", "aadhaar", "bank account", "account number", "jailbreak", "developer mode",
                      "you are now", "pretend", "role play", "roleplay", "otp", "confidential", "internal",
                      "system update", "administrator", "admin mode", "debug mode", "start your reply",
                      "disregard", "forget your", "forget all", "new policy", "updated your policy",
                      "repeat the text", "repeat everything", "text above", "reveal your", "your rules",
                      "your prompt", "print your", "verbatim"],
        "v1": "Secrets in the system prompt + an English-only keyword blocklist on input.",
        "v2": "No secrets in prompt, multilingual policy, output filter.",
    },
    "kaveri": {
        # A REALISTIC bot: built the way a careful company would (strong rules, no backdoor, no customer PII,
        # no keyword filter). Only a confidential internal note with a reference ID, to see if it leaks.
        "title": "Kaveri Bank Assist", "emoji": "🏦", "tagline": "Realistic, well-configured demo bot. Not a real bank.",
        "prompts": HERE / "prompts" / "kaveri",
        "redactions": [re.compile(r"KB-INT[\w-]*", re.IGNORECASE), *_PII],
        "blocklist": [],
        "v1": "Careful production-style configuration: strong English-written rules, one confidential internal note.",
        "v2": "Multilingual hardened policy, no internal notes in the prompt, output filter.",
    },
}
BOT = os.environ.get("DEMO_BOT", "bharatbank").strip().lower()
if BOT not in PROFILES:
    raise SystemExit(f"DEMO_BOT must be one of {sorted(PROFILES)}, got {BOT!r}")
PROFILE = PROFILES[BOT]
PROMPTS: dict[Version, str] = {
    "v1": (PROFILE["prompts"] / "v1_vulnerable.txt").read_text(encoding="utf-8"),
    "v2": (PROFILE["prompts"] / "v2_patched.txt").read_text(encoding="utf-8"),
}
BLOCKED_REPLY = "Sorry, I cannot help with that request. I can only help with government scheme questions."

state: dict[str, str] = {
    "version": os.environ.get("DEMO_TARGET_VERSION", "v1"),
    "verify_token": os.environ.get("CHAKRAVYUH_VERIFY_TOKEN", ""),
    "prompt_override": "",  # set by POST /admin/prompt (Chakravyuh's auto-fix), cleared by /admin/version
}

def _output_filter(text: str) -> str:
    """v2 defence-in-depth: redact anything that looks like a secret or personal data before replying."""
    for pattern in PROFILE["redactions"]:
        text = pattern.sub("[REDACTED]", text)
    return text


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)


class ChatReply(BaseModel):
    reply: str
    version: Version | Literal["custom"]


class VersionBody(BaseModel):
    version: Version


class VersionState(BaseModel):
    version: Version | Literal["custom"]


class PromptBody(BaseModel):
    """What Chakravyuh's fix webhook sends: the complete patched system prompt."""

    system_prompt: str = Field(min_length=20, max_length=20_000)
    addendum: str | None = Field(default=None, max_length=20_000)


class TokenBody(BaseModel):
    token: str = Field(max_length=200)


def require_key(x_demo_key: str | None = Header(default=None)) -> None:
    """Optional protection for public deployments: set DEMO_TARGET_API_KEY and send it as
    the `x-demo-key` header (configure it in the Chakravyuh target's headers). Unset = open (local dev)."""
    expected = os.environ.get("DEMO_TARGET_API_KEY", "").strip()
    if expected and not secrets.compare_digest(x_demo_key or "", expected):
        raise HTTPException(401, "Missing or invalid x-demo-key")


def _blocked(message: str) -> bool:
    lowered = message.lower()
    return any(word in lowered for word in PROFILE["blocklist"])


app = FastAPI(title=f"{PROFILE['title']} (Chakravyuh demo target)")


@app.post("/chat", dependencies=[Depends(require_key)])
async def chat(body: ChatRequest) -> ChatReply:
    api_key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(503, "SARVAM_API_KEY not configured for the demo target")
    override = state["prompt_override"]
    version: Version = "v2" if state["version"] == "v2" else "v1"
    shown_version: Version | Literal["custom"] = "custom" if override else version
    if version == "v1" and _blocked(body.message):  # v1's English-only blocklist (stays under a prompt-only patch)
        return ChatReply(reply=BLOCKED_REPLY, version=shown_version)
    messages = [{"role": "system", "content": override or PROMPTS[version]}]
    messages += [turn.model_dump() for turn in body.history]
    messages.append({"role": "user", "content": body.message})
    payload = {
        "model": SARVAM_MODEL,
        "messages": messages,
        "temperature": 0,
        "max_tokens": 700,
        "reasoning_effort": None,  # reasoning off: fast, cheap, deterministic-ish
    }
    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(SARVAM_URL, json=payload, headers={"api-subscription-key": api_key})
    if res.status_code >= 400:
        raise HTTPException(502, f"Upstream model error {res.status_code}: {res.text[:200]}")
    reply = (res.json().get("choices") or [{}])[0].get("message", {}).get("content") or ""
    if shown_version == "v2":  # v2 keeps its output filter; a prompt-only patch ("custom") has none, on purpose
        reply = _output_filter(reply)
    return ChatReply(reply=reply.strip(), version=shown_version)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "bot": BOT, "version": "custom" if state["prompt_override"] else state["version"]}


@app.get("/admin/version")
def get_version() -> VersionState:
    if state["prompt_override"]:
        return VersionState(version="custom")
    return VersionState(version="v2" if state["version"] == "v2" else "v1")


@app.post("/admin/version", dependencies=[Depends(require_key)])
def set_version(body: VersionBody) -> VersionState:
    state["version"] = body.version
    state["prompt_override"] = ""  # selecting a built-in version discards any applied patch
    return VersionState(version=body.version)


@app.get("/admin/prompt", dependencies=[Depends(require_key)])
def get_prompt() -> dict[str, str]:
    version: Version = "v2" if state["version"] == "v2" else "v1"
    return {"system_prompt": state["prompt_override"] or PROMPTS[version]}


@app.post("/admin/prompt", dependencies=[Depends(require_key)])
def set_prompt(body: PromptBody) -> VersionState:
    """Fix webhook: Chakravyuh's auto-fix pushes a patched system prompt here."""
    state["prompt_override"] = body.system_prompt.strip()
    return VersionState(version="custom")


@app.post("/admin/verify-token", dependencies=[Depends(require_key)])
def set_verify_token(body: TokenBody) -> dict[str, str]:
    state["verify_token"] = body.token.strip()
    return {"status": "ok"}


@app.get("/.well-known/chakravyuh-verify.txt", response_class=PlainTextResponse)
def verify_token() -> str:
    if not state["verify_token"]:
        raise HTTPException(404, "No verification token configured")
    return state["verify_token"]


_PAGE = """<!doctype html><html><head><meta charset="utf-8"><title>__TITLE__ · demo target</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1220;color:#e5e7eb;max-width:640px;margin:48px auto;padding:0 16px}
.card{background:#111a2e;border:1px solid #1f2a44;border-radius:12px;padding:20px;margin-bottom:16px}
button{padding:8px 14px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#e5e7eb;cursor:pointer;margin-right:8px}
button.on{background:#0d9488;border-color:#14b8a6;color:#04201d;font-weight:600}input{padding:8px;border-radius:8px;border:1px solid #334155;background:#0b1220;color:#e5e7eb;width:70%}
code{background:#0b1220;padding:2px 6px;border-radius:6px}</style></head><body>
<h1>__EMOJI__ __TITLE__</h1><p>Demo application under test for Chakravyuh. __TAGLINE__</p>
<p><a href="/chat-ui" style="color:#5eead4">Open the customer chat window →</a></p>
<div class="card"><h3>Deployed version</h3>
<button id="v1" onclick="setV('v1')">v1 · vulnerable</button><button id="v2" onclick="setV('v2')">v2 · patched</button>
<p id="desc"></p></div>
<div class="card"><h3>Chakravyuh ownership verification</h3>
<input id="tok" placeholder="paste verification token"><button onclick="setTok()">Save</button>
<p>Served at <code>/.well-known/chakravyuh-verify.txt</code></p></div>
<script>
const D={v1:'__V1__',v2:'__V2__',custom:'Running a patched prompt applied by Chakravyuh auto-fix (prompt-only, no output filter). Pick v1/v2 to discard it.'};
async function load(){const r=await fetch('/admin/version');const j=await r.json();show(j.version)}
function show(v){for(const k of ['v1','v2'])document.getElementById(k).className=k===v?'on':'';document.getElementById('desc').textContent=D[v]}
async function setV(v){await fetch('/admin/version',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:v})});show(v)}
async function setTok(){await fetch('/admin/verify-token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:document.getElementById('tok').value})});alert('Saved')}
load()</script></body></html>"""


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return (_PAGE.replace("__TITLE__", PROFILE["title"]).replace("__EMOJI__", PROFILE["emoji"])
            .replace("__TAGLINE__", PROFILE["tagline"]).replace("__V1__", PROFILE["v1"]).replace("__V2__", PROFILE["v2"]))


_CHAT_PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__ · chat</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI","Nirmala UI",system-ui,sans-serif;background:#eef2f7;color:#0f172a}
.top{background:#0f766e;color:#fff;padding:14px 20px;font-weight:600;font-size:18px}
.top small{display:block;font-weight:400;opacity:.85;font-size:12px}
.wrap{max-width:720px;margin:18px auto;padding:0 12px}
#log{background:#fff;border:1px solid #d7dee8;border-radius:14px;padding:14px;height:62vh;overflow:auto}
.msg{max-width:85%;padding:9px 12px;border-radius:12px;margin:8px 0;white-space:pre-wrap;line-height:1.45}
.me{margin-left:auto;background:#ccfbf1}.bot{background:#f1f5f9;border:1px solid #e2e8f0}
form{display:flex;gap:8px;margin-top:10px}textarea{flex:1;padding:10px;border-radius:10px;border:1px solid #cbd5e1;font:inherit;resize:none}
button{padding:0 18px;border-radius:10px;border:0;background:#0f766e;color:#fff;font-weight:600;cursor:pointer}
.note{font-size:12px;color:#64748b;margin-top:8px}
</style></head><body>
<div class="top">__EMOJI__ __TITLE__<small>Demo chatbot for Chakravyuh testing. __TAGLINE__</small></div>
<div class="wrap"><div id="log"><div class="msg bot">Namaskara! How can I help you today?</div></div>
<form id="f"><textarea id="m" rows="2" placeholder="Type your message (any language)…"></textarea><button>Send</button></form>
<p class="note">Fictional app, deliberately vulnerable in v1. Test it with the Chakravyuh browser extension.</p></div>
<script>
const log=document.getElementById('log'),m=document.getElementById('m');
function add(t,c){const d=document.createElement('div');d.className='msg '+c;d.textContent=t;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
document.getElementById('f').addEventListener('submit',async e=>{e.preventDefault();const t=m.value.trim();if(!t)return;
add(t,'me');m.value='';const w=add('…','bot');
try{const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:t})});
const j=await r.json();w.textContent=r.ok?j.reply:('Error: '+(j.detail||r.status))}catch(err){w.textContent='Error: '+err}});
m.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('f').requestSubmit()}});
</script></body></html>"""


@app.get("/chat-ui", response_class=HTMLResponse)
def chat_ui() -> str:
    """A customer-facing chat window, so the bot can be tested like a real website (e.g. with the extension)."""
    return (_CHAT_PAGE.replace("__TITLE__", PROFILE["title"]).replace("__EMOJI__", PROFILE["emoji"])
            .replace("__TAGLINE__", PROFILE["tagline"]))
