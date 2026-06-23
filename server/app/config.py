from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


SERVER_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(SERVER_DIR / ".env", SERVER_DIR / "local-settings.txt"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    google_ai_api_key: str | None = Field(default=None, alias="GOOGLE_AI_API_KEY")
    google_ai_model: str = Field(default="gemini-2.5-flash", alias="GOOGLE_AI_MODEL")
    allowed_origins: str = Field(
        default="http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000",
        alias="ALLOWED_ORIGINS",
    )
    firebase_project_id: str | None = Field(default=None, alias="FIREBASE_PROJECT_ID")
    firebase_client_email: str | None = Field(default=None, alias="FIREBASE_CLIENT_EMAIL")
    firebase_private_key: str | None = Field(default=None, alias="FIREBASE_PRIVATE_KEY")
    port: int = Field(default=8000, alias="PORT")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    rate_limit_per_minute: int = Field(default=5, alias="RATE_LIMIT_PER_MINUTE")
    ai_timeout_seconds: int = Field(default=45, alias="AI_TIMEOUT_SECONDS")
    ai_max_output_tokens: int = Field(default=12288, ge=4096, le=16384, alias="AI_MAX_OUTPUT_TOKENS")
    ai_temperature: float = Field(default=0.45, ge=0, le=1, alias="AI_TEMPERATURE")

    @property
    def origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def normalized_private_key(self) -> str | None:
        if not self.firebase_private_key:
            return None
        return self.firebase_private_key.replace("\\n", "\n")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
