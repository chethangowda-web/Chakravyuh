"""Generate docs/Chakravyuh_Pitch.pptx (10 slides). Run: python scripts/make_deck.py"""
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

BG = RGBColor(0x0B, 0x10, 0x1F)
CARD = RGBColor(0x16, 0x1E, 0x36)
ACCENT = RGBColor(0xF5, 0x9E, 0x0B)
CYAN = RGBColor(0x22, 0xD3, 0xEE)
WHITE = RGBColor(0xF1, 0xF5, 0xF9)
MUTED = RGBColor(0x94, 0xA3, 0xB8)
RED = RGBColor(0xEF, 0x44, 0x44)
GREEN = RGBColor(0x22, 0xC5, 0x5E)

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]


def box(s, x, y, w, h, fill=CARD, shape=MSO_SHAPE.ROUNDED_RECTANGLE):
    sh = s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    sh.fill.solid(); sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        sh.adjustments[0] = 0.06
    return sh


def text(s, x, y, w, h, t, size=18, color=WHITE, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    lines = t if isinstance(t, list) else [t]
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run(); r.text = ln
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = "Calibri"
        p.space_after = Pt(6)
    return tb


def slide(title, kicker=None):
    s = prs.slides.add_slide(BLANK)
    s.background.fill.solid(); s.background.fill.fore_color.rgb = BG
    box(s, 0, 0, 0.18, 7.5, ACCENT, MSO_SHAPE.RECTANGLE)
    if kicker:
        text(s, 0.7, 0.4, 11, 0.4, kicker.upper(), 13, ACCENT, True)
    text(s, 0.7, 0.75, 12, 1, title, 34, WHITE, True)
    text(s, 0.7, 7.0, 8, 0.3, "Chakravyuh · Build with Sarvam", 11, MUTED)
    text(s, 12.0, 7.0, 0.8, 0.3, str(len(prs.slides)), 11, MUTED, align=PP_ALIGN.RIGHT)
    return s


def cards(s, items, y=2.0, h=4.3, cols=None):
    cols = cols or len(items)
    w = (11.9 - 0.3 * (cols - 1)) / cols
    for i, (head, body, col) in enumerate(items):
        x = 0.7 + i * (w + 0.3)
        box(s, x, y, w, h)
        box(s, x, y, w, 0.08, col, MSO_SHAPE.RECTANGLE)
        text(s, x + 0.25, y + 0.3, w - 0.5, 0.9, head, 26, col, True)
        text(s, x + 0.25, y + 1.4, w - 0.5, h - 1.5, body, 20, WHITE)


# 1 Title
s = prs.slides.add_slide(BLANK)
s.background.fill.solid(); s.background.fill.fore_color.rgb = BG
CX, CY = 10.0, 3.75
for i, r in enumerate([2.9, 2.2, 1.5, 0.8]):
    c = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(CX - r), Inches(CY - r), Inches(2 * r), Inches(2 * r))
    c.fill.background(); c.line.color.rgb = [CYAN, ACCENT, CYAN, ACCENT][i]; c.line.width = Pt(3)
# the gap in every ring: the weak spot attackers walk through
box(s, CX + 0.5, CY - 0.2, 2.6, 0.4, BG, MSO_SHAPE.RECTANGLE)
for k, dx in enumerate([0.9, 1.6, 2.3, 2.95]):
    d = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(CX + dx - 0.09), Inches(CY - 0.09), Inches(0.18), Inches(0.18))
    d.fill.solid(); d.fill.fore_color.rgb = RED; d.line.fill.background()
core = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(CX - 0.3), Inches(CY - 0.3), Inches(0.6), Inches(0.6))
core.fill.solid(); core.fill.fore_color.rgb = GREEN; core.line.fill.background()
text(s, CX - 1.5, 6.75, 3, 0.4, "Every ring has a gap. We find it.", 13, MUTED, align=PP_ALIGN.CENTER)
box(s, 0.8, 1.55, 1.6, 0.06, ACCENT, MSO_SHAPE.RECTANGLE)
text(s, 0.8, 1.7, 6.2, 1.3, "Chakravyuh", 66, WHITE, True)
text(s, 0.8, 3.0, 6.0, 1.4, "Indic red-teaming lab and runtime shield for LLM and voice apps", 22, CYAN)
for i, lang in enumerate(["English", "हिन्दी", "ಕನ್ನಡ", "తెలుగు", "தமிழ்"]):
    x = 0.8 + i * 1.15
    box(s, x, 4.6, 1.05, 0.45, CARD)
    text(s, x, 4.6, 1.05, 0.45, lang, 13, WHITE, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
text(s, 0.8, 5.6, 6.2, 1, ["Build with Sarvam · Security and Developer Tools track", "Vertex Club × Sarvam AI · REVA University, Nov 2026"], 14, MUTED)

# 2 Problem
s = slide("AI apps are tested in English. Attackers are not.", "The problem")
cards(s, [
    ("India speaks 22+ languages", "Users type native script, romanized text and code-mixed Hinglish or Kanglish, often in one sentence.", CYAN),
    ("Guardrails are English-first", "Keyword blocklists and safety prompts that hold in English can fall apart in Kannada, Telugu, Hindi or Tamil.", ACCENT),
    ("Nobody measures the gap", "Banks and government helpdesks ship chatbots and voice bots with no Indic security testing, and leaks include PII and internal rules.", RED),
])

# 3 Solution
s = slide("Attack it. Fix it. Prove it. Guard it.", "The solution")
cards(s, [
    ("1 · Attack", "Adaptive AI attacker in 5 languages and 3 script styles, over text and voice.", RED),
    ("2 · Fix", "AI writes a patched system prompt as a diff. One click applies it.", ACCENT),
    ("3 · Prove", "Regression replay with held-out attacks and an over-refusal check.", GREEN),
    ("4 · Guard", "Shield: a runtime proxy that blocks attacks in any language.", CYAN),
], cols=4)

# 4 How the attacker works
s = slide("An attacker that learns from every refusal", "Adaptive AI attacker")
steps = ["Plan in English\n(Sarvam-105B)", "Localize\n(Sarvam Translate)", "Send to your bot\n(verified origin only)", "Judge with evidence\n(rules first, model second)", "Adapt tactic\nand retry"]
w = 2.2
for i, t in enumerate(steps):
    x = 0.7 + i * (w + 0.22)
    box(s, x, 2.4, w, 1.6, CARD)
    text(s, x + 0.1, 2.4, w - 0.2, 1.6, t.split("\n"), 15, WHITE, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
text(s, 0.7, 4.5, 12, 2.4, [
    "• Six categories: prompt extraction, PII leak, injection, jailbreak, harmful content, voice.",
    "• Every attempt is stored as a timeline with the attacker's reasoning.",
    "• Findings are proven by deterministic rules (about 80%); the model judge confirms the rest.",
], 22)

# 5 Language gap
s = slide("The Language Security Gap is real and measurable", "Findings")
text(s, 0.7, 1.9, 12, 0.5, "Demo bot Sahayak Seva (government-scheme helpdesk), same attacks in each language", 16, MUTED)
for i, (lbl, v, col) in enumerate([("English", 31, CYAN), ("Kannada", 69, RED)]):
    y = 2.8 + i * 1.3
    text(s, 0.7, y, 2, 0.8, lbl, 22, WHITE, True, anchor=MSO_ANCHOR.MIDDLE)
    box(s, 2.7, y + 0.1, 9 * v / 100, 0.6, col)
    text(s, 2.8 + 9 * v / 100, y, 1.5, 0.8, f"{v}%", 24, col, True, anchor=MSO_ANCHOR.MIDDLE)
text(s, 0.7, 5.6, 12, 1.2, [
    "The English-only blocklist stopped 9 of 16 English attacks, and far fewer once the same attack was written in Kannada.",
    "Sarvam outputs vary run to run, so we report ranges from saved campaigns, not a single best run.",
], 16, MUTED)

# 6 Fix loop
s = slide("Fixes that generalise, not just replay", "Auto-fix and regression proof")
cards(s, [
    ("Hardening timeline", "Attacks still succeeding after each round: 7 → 0 on our stage campaign.", GREEN),
    ("Held-out proof", "Patch author never sees the held-out set. Seen attacks 5 → 0, unseen 4 → 0.", CYAN),
    ("Over-refusal check", "10 ordinary banking questions per language before and after: 100% → 97% still answered.", ACCENT),
])
text(s, 0.7, 6.4, 12, 0.5, "Honest limit: one Kannada code-mixed injection survived two fix rounds in a final run. We show that too.", 15, MUTED)

# 7 Shield
s = slide("Chakravyuh Shield: a runtime guard in front of any bot", "Defence")
text(s, 0.7, 2.0, 5.8, 3.5, [
    "• Sarvam language ID + Translate read every message in English, whatever the script.",
    "• Fast rules plus a Sarvam-105B classifier block attacks before the bot sees them.",
    "• Replies are checked too, including secrets transliterated into Indic script.",
    "• Refusals come back in the user's own language.",
    "• Adds about 3 to 6 seconds per message.",
], 19)
for i, (lbl, v, col) in enumerate([("Sahayak, bare", 56, RED), ("Sahayak + Shield", 5, GREEN), ("Kaveri Bank, bare", 22, RED), ("Kaveri + Shield", 4, GREEN)]):
    y = 2.1 + i * 0.95
    text(s, 7.0, y, 2.6, 0.7, lbl, 16, WHITE, anchor=MSO_ANCHOR.MIDDLE)
    box(s, 9.6, y + 0.12, max(0.1, 2.6 * v / 60), 0.46, col)
    text(s, 9.7 + 2.6 * v / 60, y, 1.2, 0.7, f"{v}%", 18, col, True, anchor=MSO_ANCHOR.MIDDLE)
text(s, 7.0, 6.0, 5.8, 0.8, "Attack success rate, same config. False-block check: 30 of 30 legitimate questions allowed.", 13, MUTED)

# 8 Voice + integrations
s = slide("Voice bots, CI pipelines and the browser", "Beyond text")
cards(s, [
    ("Voice replay", "Attacks go through Sarvam TTS → STT → bot, alongside a text twin. Text 7/12 vs voice 8/12: voice inherits text weaknesses.", CYAN),
    ("GitHub Action + CI gate", "Fails the build when critical findings or the language gap cross a threshold. Published as v1.0.0.", GREEN),
    ("Chrome extension", "Match, attack and check a bot from the browser, verified origins only.", ACCENT),
])

# 9 Live challenge
s = slide("Break the Chakravyuh: live, on stage", "Judge challenge")
text(s, 0.7, 2.0, 7, 4, [
    "1. Judge attacks the unprotected bot, by typing or by voice.",
    "2. We activate Shield and replay the same stored prompt.",
    "3. Compare both replies side by side.",
    "",
    "Verdicts come only from evidence tied to planted synthetic data: a canary string or PII in the bot's own prompt. Anything else is labelled 'possible'.",
], 21)
box(s, 8.2, 2.0, 4.4, 3.8)
text(s, 8.5, 2.2, 3.9, 3.4, ["Findings carry", "OWASP LLM01 / 02 / 07 and", "DPDP §8(5) labels", "", "marked 'possible', never over-claimed"], 20, CYAN, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)

# 10 Close
s = slide("Why Chakravyuh, and what's next", "Impact and roadmap")
cards(s, [
    ("Built and verified", "FastAPI + React/TypeScript, 107 backend tests, Docker, public GitHub repo, uses Sarvam-105B, Translate, language ID, TTS and STT.", GREEN),
    ("Who it helps", "Banks, fintech and government teams shipping Indic chatbots and voice bots under DPDP obligations.", CYAN),
    ("Next", "More languages, OWASP/DPDP audit exports, hosted multi-tenant version, deeper voice attacks.", ACCENT),
], h=3.8)
text(s, 0.7, 6.1, 12, 0.8, "Test in every language your users speak.", 26, ACCENT, True)

out = Path(__file__).resolve().parent.parent / "docs" / "Chakravyuh_Pitch.pptx"
try:
    prs.save(out)
except PermissionError:
    out = out.with_name("Chakravyuh_Pitch_v2.pptx")
    prs.save(out)
print("saved", out, len(prs.slides), "slides")
