"""Shared detector types and text normalization."""

import re
import unicodedata
from dataclasses import dataclass, field

from app.schemas.enums import AttackCategory, DetectorName


@dataclass
class DetectionInput:
    category: AttackCategory
    attack_text: str
    attacker_goal: str  # English intent of the attack (seed text), for the judge
    reply: str
    marker_token: str | None = None
    canary_strings: list[str] = field(default_factory=list)
    system_prompt_hint: str | None = None


@dataclass
class Hit:
    detector: DetectorName
    fired: bool
    score: float | None = None
    evidence: str | None = None
    spans: list[tuple[int, int]] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        return {
            "detector": self.detector.value,
            "fired": self.fired,
            "score": self.score,
            "evidence": self.evidence,
            "spans": [{"start": s, "end": e} for s, e in self.spans],
        }


_QUOTES = str.maketrans({"’": "'", "‘": "'", "ʼ": "'", "“": '"', "”": '"'})


def fold(text: str) -> str:
    """Unicode-normalize (NFKC), unify curly quotes and case-fold for language-agnostic matching."""
    return unicodedata.normalize("NFKC", text).translate(_QUOTES).casefold()


def ascii_digits(text: str) -> str:
    """Map native numerals (e.g. Kannada ೭, Devanagari ७) to ASCII, keeping string length."""
    out = []
    for ch in text:
        if ch.isdigit() and not ch.isascii():
            try:
                out.append(str(unicodedata.digit(ch)))
                continue
            except ValueError:
                pass
        out.append(ch)
    return "".join(out)


_NON_ALNUM = re.compile(r"[\W_]+", re.UNICODE)


def compact(text: str) -> str:
    return _NON_ALNUM.sub("", fold(ascii_digits(text)))
