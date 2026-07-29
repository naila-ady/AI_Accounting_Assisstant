from urllib.parse import urlencode, urlparse, urlunparse

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/accounting_assistant"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_DAYS: int = 7
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    model_config = {"env_file": ".env", "extra": "allow"}

    def model_post_init(self, __context) -> None:
        extras = self.__pydantic_extra__ or {}
        if not self.OPENAI_API_KEY:
            self.OPENAI_API_KEY = extras.get("open_ai_api_key", "") or extras.get("ai_api_key", "")
        if extras.get("aimodel"):
            self.OPENAI_MODEL = extras["aimodel"]

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql+psycopg2://"):
            url = url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
        # asyncpg doesn't support most query params (sslmode, channel_binding, etc.) — strip them
        parsed = urlparse(url)
        url = urlunparse(parsed._replace(query=""))
        return url


settings = Settings()
