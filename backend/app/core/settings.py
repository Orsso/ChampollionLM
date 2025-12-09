from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings


BASE_BACKEND_DIR = Path(__file__).resolve().parents[2]


class AppSettings(BaseSettings):
    """Application runtime configuration.

    References:
    - docs/environment_requirements.md
    - docs/audio_storage_policy.md
    - docs/api_key_encryption.md
    """

    app_name: str = "Champollion"

    database_url: str = Field(
        default=f"sqlite+aiosqlite:///{(BASE_BACKEND_DIR / 'champollion.db').as_posix()}",
        description="Async SQLAlchemy connection string",
    )

    @field_validator("database_url", mode="after")
    @classmethod
    def normalize_database_url(cls, v: str) -> str:
        """Convert Fly.io postgres:// to postgresql+asyncpg:// for async SQLAlchemy."""
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    fernet_secret_key: SecretStr = Field(..., description="Base64 Fernet key")

    jwt_secret: SecretStr = Field(..., description="JWT secret for FastAPI Users")
    jwt_lifetime_seconds: int = Field(default=3600, ge=300)

    audio_storage_root: Path = Field(
        default=Path("./storage/audio"), description="Root directory for audio files"
    )
    max_audio_bytes: int = Field(default=500 * 1024 * 1024, ge=1)
    max_audio_duration_seconds: int = Field(default=7200, ge=1)

    environment: Literal["dev", "test", "prod"] = Field(default="dev")
    
    cors_allowed_origins: list[str] = Field(
        default=[],
        description="Allowed CORS origins for production (comma-separated in .env)"
    )

    # Accept optional provider API key to avoid .env validation errors; not used at runtime
    mistral_api_key: SecretStr | None = None

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore",
    }


@lru_cache(maxsize=1)
def get_settings() -> AppSettings:
    return AppSettings()


settings = get_settings()

