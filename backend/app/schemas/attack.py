"""Attack library and preview contracts."""

from pydantic import Field

from app.schemas.common import StrictModel
from app.schemas.enums import AttackCategory, AttackWrapper, LanguageCode, Mutation, ScriptVariant


class AttackTemplateOut(StrictModel):
    id: str
    category: AttackCategory
    technique: str
    language: LanguageCode
    text: str
    marker_required: bool
    notes: str | None


class AttackTemplateList(StrictModel):
    items: list[AttackTemplateOut]


class AttackPreviewRequest(StrictModel):
    template_id: str = Field(min_length=1)
    languages: list[LanguageCode] = Field(min_length=1)
    variants: list[ScriptVariant] = Field(min_length=1)
    wrappers: list[AttackWrapper] = Field(default_factory=list)


class AttackVariantOut(StrictModel):
    language: LanguageCode
    variant: ScriptVariant
    mutation_chain: list[Mutation]
    attack_text: str
    english_gloss: str | None
    detected_language: str | None
    detected_script: str | None
    marker_token: str | None


class AttackPreviewResponse(StrictModel):
    template: AttackTemplateOut
    variants: list[AttackVariantOut]
    warnings: list[str]


class AttackGenerateRequest(StrictModel):
    template_id: str = Field(min_length=1)
    count: int = Field(default=3, ge=1, le=5)


class AttackGenerateResponse(StrictModel):
    template_id: str
    paraphrases: list[str]
