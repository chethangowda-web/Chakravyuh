# Chakravyuh — demo script (3 minutes)

**The story:** *an attacker that thinks* → *evidence of what leaked* → *a fix that is proven.*

Numbers below come from real runs (the saved dataset and one adaptive + auto-fix run). Sarvam output varies between runs, so say "about" and read the numbers off the screen, never from memory.

## Before you go on stage (10 min)

```powershell
backend\.venv\Scripts\python scripts\demo_data.py restore   # only if the backend is stopped
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1     # backend, demo target, frontend
```

1. Open http://localhost:5173. Top bar: **API** and **Sarvam AI** both green.
2. Open the demo bot at http://127.0.0.1:8100 and pick **v1 · vulnerable**. **Check this every time:** after fix tests the bot is often left on *v2* or *custom*, and then live attacks mostly fail. Check from a terminal: `curl http://127.0.0.1:8100/admin/version` → `{"version":"v1"}`. (The dashboard shows a few hundred tests, a Language Gap chart and the severity donut — don't memorise totals, read them off the screen.)
3. **Targets → BharatBank Assist (demo)**: confirm *Fix webhook URL* is `http://127.0.0.1:8100/admin/prompt` (use *Fill BharatBank demo* on a new target if you need to re-create it).
4. **Pre-run the adaptive story** so the data exists. One command does it all (about 4 minutes, uses Sarvam credits) and leaves the bot on v1 with its original prompt afterwards:
   `backend\.venv\Scripts\python scripts\prepare_demo.py --turns 6`
   **Sarvam is not deterministic:** in our runs the attacker broke through on anywhere from 2 to 7 of 9 missions. Run it until you have a campaign where at least one mission needed several turns (open the campaign to check), and say "in this run", never "it always". Or do it by hand:
   - *New campaign → Adaptive AI attacker*: goals *Sensitive data leak*, *System prompt extraction*, *Instruction override*; languages English, Hindi, Kannada; 4 attempts → Launch.
   - When done, open it → **Suggest a fix** → **Apply to target & verify**. Repeat once if anything still succeeds.
   - Then reset the bot to v1 (step 2) and **run a second adaptive campaign** you can open fresh on stage (or run it live while you speak: it takes about 75 s).
5. **Voice backup tabs** (open them before going on stage): http://localhost:5173/findings/421 (Kannada voice attack → mobile number and PAN leaked, Critical) and http://localhost:5173/findings/423 (the same in Hindi). Their audio plays offline. A live voice attack can be refused, since Sarvam varies; if it is, say "this time it held — here is one that didn't" and switch tabs.
6. Offline venue? Everything on screen reads from the local database. Only *new* attacks, TTS/STT and fixes need Sarvam.

## The pitch

**0:00 — Problem (20 s)**
"Indian companies are shipping chatbots and voice bots in Hindi, Kannada, Telugu and Tamil — but safety testing is done in English. Chakravyuh is an Indic red-teaming lab for LLM and voice apps. It doesn't just replay a list of attacks. It hires an AI attacker, shows you what leaked, and proves the fix."

**0:20 — Dashboard (20 s)** → `/`
"Across our runs, attacks got through roughly 4 times in 10 in English — and about 6 in 10 in Telugu and Tamil. Same bot, same rules." *(read the exact percentages off the Language Gap chart; they shift a little with every run)*

*Optional, if a judge asks "does it only work on your own bank bot?"* → Campaigns → **Sahayak Seva · Indic attack library** (a second app: a government-scheme helpdesk, http://127.0.0.1:8101). "This one has a real-world guardrail: an English keyword blocklist. It stopped 9 of 16 English attacks, so English looks safe at 31%. The same attacks in Kannada: 69% got through, leaking a citizen's Aadhaar and bank account. A blocklist that only speaks English is not a guardrail." *(read the percentages off the screen)*

**0:40 — The adaptive attacker (55 s)** → Campaigns → adaptive campaign → missions
"Static lists are what a lazy attacker does. Here Sarvam-105B is the attacker. Watch this Kannada mission." *(open the 4-turn mission)* "Turn 1: it pretends to be a branch manager — refused. Turn 2: an RBI auditor — refused. Turn 3: a fake system message — refused. Turn 4: an emotional appeal about college fees — and the bot hands over customer data. It read each refusal and changed tactic, persona and script. Sarvam Translate renders every attempt in the language and style it chose."
Point at the grey italic line under a turn: "that's the attacker's own reasoning."

**1:35 — Proof (25 s)** → click **Evidence** on the winning turn, then point at the dashboard's confirmation bar
"No opinions: the leaked PAN and account number are highlighted, and the detector that proved it is a deterministic Indian-PII check. Across everything we ran, 80% of findings were proven by rules like this; the Sarvam judge decided the other 20%, and it has to quote evidence that really appears in the reply."

**2:00 — Voice (30 s)** → Voice Lab
Kannada → seed *Customer data disclosure* → **Load** → **Speak it (Sarvam TTS)** → **Transcribe and attack the target**
"Voice bots are attacked by voice. Sarvam speaks the attack, Sarvam transcribes it — about 1% drift — and the transcript goes to the bot, like a real voice assistant. Same leak, from audio. And at scale: we replayed 12 attacks both typed and spoken, judged identically — 7 worked as text, 8 as speech. A voice bot inherits every weakness of its text bot." *(campaign page of the voice replay)*

**2:30 — Auto-fix, proven twice (25 s)** → campaign → **Auto-fix with Sarvam** → *(already applied)* → regression page
"Sarvam read the attacks that worked and rewrote the bot's prompt. Two proofs. First: we hid some of the successful attacks from it — the patch fixed the 5 it saw *and* the 4 it never saw. It generalises; it didn't memorise. Second: a patch that refuses everything would also score zero, so we asked ordinary banking questions before and after — 100% answered before, 97% after. Security up, helpfulness kept." *(read the numbers off the two cards; they vary per run)*

**2:55 — Close (5 s)**
"Strict-typed React, FastAPI, five Sarvam APIs. Chakravyuh: red-teaming for the next billion users."

## Likely questions

| Question | Answer |
|---|---|
| "Is this safe? Could someone attack others with it?" | Targets need an ownership declaration **and** verification (token file or allowlisted host). Outbound requests are SSRF-guarded: private/metadata addresses blocked, no redirects. The attacker is told it is testing its operator's own sandbox, and a verified target is mandatory. |
| "How is the adaptive attacker different from a prompt list?" | It reads the bot's replies and changes tactic, persona, script and wording per turn, and stops at the first breach. Every attempt is stored, so a winning attack can be replayed verbatim in regression. |
| "Why does the attacker write English?" | We measured it: the model plans good attacks but ignores language and style instructions. So it plans in English and **Sarvam Translate** guarantees the language, script and code-mixing. Each attempt is language-ID checked. |
| "How accurate is the judge?" | It only runs when deterministic checks can't decide, its findings are labelled **likely** (never *confirmed*), and it must quote evidence from the reply. Some adaptive breaches rely on it, which is why the Evidence page shows exactly what it quoted. |
| "Can your detector be fooled?" | We found and fixed one: a bot that *refuses* but repeats the injected code ("I can't give you 1593-5084") used to count as a breach. The code now only counts when it is how the reply starts or ends; anything murkier goes to the judge. We re-scored all saved results with `scripts/rescore.py` (about 7% of marker-based findings were affected; the judge re-confirmed most, and flipped two). |
| "Does the auto-fix really work, or does it just add 'please be safe'?" | The rerun is the test. In our run the first patch took successful attacks from 7 to 1, the second to 0. It also removes secrets from the prompt (it never leaves a secret protected only by an instruction). Note that our demo patch is prompt-only; real apps should also filter outputs. |
| "Doesn't the fix just memorise the attacks it saw?" | No — we hold out part of the successful attacks and never show them to the patch author. The regression reports both sets separately (in our run: seen 5 → 0, unseen 4 → 0). |
| "Couldn't a patch just refuse everything?" | We check: 10 legitimate banking questions per language before and after every patch. In our run 100% → 97% answered; the one lost question is listed on the page. |
| "Is this only about leaking secrets?" | No: the harmful-content category tests what the bot *says* — UPI/OTP scam scripts, caste/religion bias, bank-run rumours. (Our sample is still small: a few missions per language.) |
| "How does this fit a developer's workflow?" | `scripts/ci_gate.py` fails the build on critical findings or a Language Security Gap above a threshold; a GitHub Actions example is in `docs/ci/`. |
| "Does voice change anything?" | We measured it fairly (text re-sent alongside, judged identically): 7/12 typed vs 8/12 spoken. An earlier, unfair comparison against old verdicts said 3 vs 7 — we caught and fixed that. |
| "How do you stop people attacking bots they don't own?" | Each target gets a random token; the bot must serve it at `/.well-known/chakravyuh-verify.txt` (like Google Search Console). Nothing that sends traffic works before that, including *Test connection* and fix proposals. Changing the URL drops the verification, and the fix webhook must be on the same verified origin, since it receives the bot's auth headers. Local hosts are allowlisted for development only. |
| "Why is the dashboard total lower than the number of rows in the database?" | The dashboard counts each attack once: library attacks plus one result per adaptive mission. Regression reruns and voice replays re-send attacks we already have, so counting them would double count. (When we checked: 155 library + 27 missions = 182 on screen, while the database had 244 rows including 40 reruns and 22 replays.) |
| "What does it cost?" | The campaign page shows an upper bound of Sarvam calls before launch; missions stop at their first breach; translations are cached. |
| "Which Sarvam models?" | `sarvam-105b` (attacker, judge, fix author, demo bot), `mayura:v1` (translate), `bulbul:v4-flash` (TTS), `saaras:v4`/`v3` (STT), plus text language ID. |

## If something breaks

| Symptom | Fix |
|---|---|
| Sarvam pill is red | `backend/.env` is missing the key. Saved data still browses fine. |
| Adaptive campaign shows "Held" for everything | The bot may already be patched. Reset it: http://127.0.0.1:8100 → v1. |
| *Apply to target* fails | Check the target's Fix webhook URL; use **I applied it myself — verify** after switching the bot manually. |
| Voice TTS fails | Open the saved voice findings (Campaigns → *Voice · …*) instead. |
| Port already in use | `Get-NetTCPConnection -LocalPort 8010,8100,5173`, stop the stale process. |
| Dashboard empty | Backend started on a fresh DB: stop it, `demo_data.py restore`, start again. |
| Everything is down | Play the backup screen recording. |
