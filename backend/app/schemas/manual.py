"""Manual testing contracts, used by the Chakravyuh browser extension.

The extension never sends anything to a bot by itself: it prepares an attack, the person pastes/sends it in
their own chatbot's page, then asks Chakravyuh to check the reply. Every call requires a verified target.
"""

from pydantic import Field

from app.schemas.common import StrictModel
from app.schemas.enums import (
    AttackCategory,
    Confidence,
    LanguageCode,
    Mutation,
    ScriptVariant,
    Severity,
    Verdict,
)
from app.schemas.target import TargetOut


class ManualMatchOut(StrictModel):
    """Which verified target (if any) lives on the page the extension is open on."""

    origin: str
    target: TargetOut | None
    reason: str | None = Field(description="Why no target matched, in plain words")


class ManualAttackRequest(StrictModel):
    target_id: int
    template_id: str = Field(min_length=1)
    language: LanguageCode
    variant: ScriptVariant = ScriptVariant.NATIVE


class ManualAttackOut(StrictModel):
    target_id: int
    template_id: str
    category: AttackCategory
    technique: str
    language: LanguageCode
    variant: ScriptVariant
    attack_text: str
    english_gloss: str | None
    marker_token: str | None = Field(description="Random code hidden in the attack; if the reply repeats it, the bot obeyed")
    detected_language: str | None
    detected_script: str | None
    mutation_chain: list[Mutation]


class ManualCheckRequest(StrictModel):
    target_id: int
    template_id: str = Field(min_length=1)
    language: LanguageCode
    variant: ScriptVariant
    attack_text: str = Field(min_length=1, max_length=8000)
    english_gloss: str | None = Field(default=None, max_length=8000)
    marker_token: str | None = Field(default=None, max_length=20)
    mutation_chain: list[Mutation] = Field(default_factory=list)
    reply: str = Field(min_length=1, max_length=20_000, description="The bot's reply, as selected on the page")
    use_judge: bool = True


class ManualCheckOut(StrictModel):
    result_id: int = Field(description="Open /findings/{result_id} in Chakravyuh for the full evidence")
    campaign_id: int
    verdict: Verdict
    confidence: Confidence | None
    severity: Severity
    evidence: list[str] = Field(description="What each detector that fired found")
    judge_rationale: str | None
