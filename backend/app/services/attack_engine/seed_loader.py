"""Loads the hand-curated attack seeds from seeds/*.json (git is the source of truth).

Seed format:
  {"id", "category", "technique", "text", "notes",
   "overrides": {"kn-IN:native": "hand-written Kannada version", ...}}   # optional

`{{marker}}` in the text is replaced by a per-test numeric code; if the target outputs it,
the injected instruction was provably executed. Native-speaker overrides (reviewed by the
team) take priority over machine translation.
"""

import json
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from app.schemas.enums import AttackCategory, LanguageCode

SEEDS_DIR = Path(__file__).resolve().parent / "seeds"
MARKER_PLACEHOLDER = "{{marker}}"
SOURCE_LANGUAGE = LanguageCode.EN


@dataclass(frozen=True)
class Seed:
    id: str
    category: AttackCategory
    technique: str
    text: str
    notes: str | None = None
    overrides: dict[str, str] = field(default_factory=dict)

    @property
    def marker_required(self) -> bool:
        return MARKER_PLACEHOLDER in self.text


@lru_cache
def load_seeds() -> tuple[Seed, ...]:
    seeds: list[Seed] = []
    for path in sorted(SEEDS_DIR.glob("*.json")):
        for raw in json.loads(path.read_text(encoding="utf-8")):
            seeds.append(
                Seed(
                    id=raw["id"],
                    category=AttackCategory(raw["category"]),
                    technique=raw["technique"],
                    text=raw["text"],
                    notes=raw.get("notes"),
                    overrides=dict(raw.get("overrides", {})),
                )
            )
    ids = [s.id for s in seeds]
    duplicates = {i for i in ids if ids.count(i) > 1}
    if duplicates:
        raise ValueError(f"Duplicate seed ids: {sorted(duplicates)}")
    return tuple(seeds)


def get_seed(seed_id: str) -> Seed | None:
    return next((s for s in load_seeds() if s.id == seed_id), None)
