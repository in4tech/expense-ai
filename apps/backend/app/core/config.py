from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_config_file = Path(__file__).resolve()
_parents = _config_file.parents
if len(_parents) > 3:
    BASE_DIR = _parents[3]
elif len(_parents) > 1:
    BASE_DIR = _parents[1]
else:
    BASE_DIR = _parents[0]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str
    OPENAI_API_KEY: str
    TAVILY_API_KEY: str
    COHERE_API_KEY: str | None = None
    REDIS_URL: str
    SECRET_KEY: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
