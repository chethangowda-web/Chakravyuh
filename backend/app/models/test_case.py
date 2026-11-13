from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models._common import json_column, utcnow
from app.schemas.enums import AttackCategory, LanguageCode, Modality, ScriptVariant


class TestCase(SQLModel, table=True):
    __test__ = False  # not a pytest test class

    id: int | None = Field(default=None, primary_key=True)
    campaign_id: int = Field(foreign_key="campaign.id", index=True)
    source_test_case_id: int | None = Field(default=None, foreign_key="testcase.id")  # regression reruns
    template_id: str
    category: AttackCategory
    technique: str
    language: LanguageCode
    variant: ScriptVariant
    mutation_chain: list[str] = Field(default_factory=list, sa_column=json_column())
    attack_text: str
    english_gloss: str | None = None
    detected_language: str | None = None
    detected_script: str | None = None
    marker_token: str | None = None
    # Adaptive-attacker missions: several attempts at one goal, each informed by the previous replies.
    mission_id: str | None = Field(default=None, index=True)
    turn: int | None = None
    tactic: str | None = None
    attacker_note: str | None = None
    modality: Modality = Modality.TEXT
    audio_id: str | None = Field(default=None, foreign_key="audioasset.id")
    transcript: str | None = None
    transcript_drift: float | None = None
    created_at: datetime = Field(default_factory=utcnow)
