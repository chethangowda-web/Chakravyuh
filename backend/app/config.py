"""Application settings.

All Sarvam model IDs live here so that a model rename during the event is a
one-line change. Values verified against docs.sarvam.ai on 2026-11-11.
"""

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Chakravyuh"
    app_version: str = "0.1.0"

    # --- Storage ---------------------------------------------------------
    data_dir: Path = BACKEND_DIR / "data"
    database_url: str | None = None  # defaults to sqlite file inside data_dir

    # --- HTTP / security -------------------------------------------------
    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    allowed_private_hosts: Annotated[list[str], NoDecode] = ["localhost", "127.0.0.1"]
    target_timeout_s: float = 20.0
    target_max_response_bytes: int = 256 * 1024
    max_cases_per_campaign: int = 300
    # Where this API is reachable by itself: shielded targets point at {public_api_base_url}/api/v1/shield/...
    public_api_base_url: str = "http://127.0.0.1:8010"

    # --- Hosted demo (see app/bootstrap.py); all optional ------------------
    seed_demo_data: bool = False
    demo_bharatbank_url: str | None = None
    demo_sahayak_url: str | None = None
    demo_kaveri_url: str | None = None
    demo_target_api_key: SecretStr | None = None

    # --- Sarvam AI -------------------------------------------------------
    sarvam_api_key: SecretStr | None = None
    sarvam_base_url: str = "https://api.sarvam.ai"
    sarvam_chat_model: str = "sarvam-105b"
    sarvam_translate_model: str = "mayura:v1"
    sarvam_tts_model: str = "bulbul:v4-flash"
    sarvam_stt_model: str = "saaras:v4"
    sarvam_stt_codemix_model: str = "saaras:v3"  # `mode` param only works on v3
    sarvam_max_concurrency: int = 4
    sarvam_timeout_s: float = 60.0

    @field_validator("cors_origins", "allowed_private_hosts", mode="before")
    @classmethod
    def _split_csv(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def resolved_database_url(self) -> str:
        if self.database_url:
            return self.database_url
        return f"sqlite:///{(self.data_dir / 'app.db').as_posix()}"

    @property
    def audio_dir(self) -> Path:
        return self.data_dir / "audio"

    @property
    def sarvam_configured(self) -> bool:
        return bool(self.sarvam_api_key and self.sarvam_api_key.get_secret_value().strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
