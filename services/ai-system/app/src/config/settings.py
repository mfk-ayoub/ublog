from functools import lru_cache
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str
    MONGODB_DATABASE: str
    MONGODB_URL: str
    GROQ_API_KEY: str = Field(repr=False)
    GEMINI_API_KEY: str = Field(repr=False)
    QDRANT_URL: str
    NUMBER_OF_REQUESTS_PER_DAY: int = Field(default=30, ge=1)
    AI_SERVICE_API_KEY: str = Field(default="", repr=False)
    AI_SERVICE_API_KEY_FILE: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_MODERATION_MODEL: str = "llama-3.3-70b-versatile"
    PROVIDER_TIMEOUT_SECONDS: float = Field(default=30.0, gt=0, allow_inf_nan=False)
    LLM_MAX_TOKENS: int = Field(default=2048, ge=2)
    MODERATION_CHUNK_SIZE: int = Field(default=6000, ge=2)
    SUMMARY_CHUNK_SIZE: int = Field(default=12000, ge=2)
    MAX_CONTEXT_CHARS: int = Field(default=24000, ge=2)
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    EMBEDDING_DIMENSIONS: int = Field(default=768, gt=0)
    EMBEDDING_BATCH_SIZE: int = Field(default=32, ge=1, le=100)
    QDRANT_COLLECTION: str = "article_chunks"
    QDRANT_API_KEY: str | None = Field(default=None, repr=False)
    RAG_TOP_K: int = Field(default=5, ge=1, le=100)
    RAG_CANDIDATE_LIMIT: int = Field(default=20, ge=1, le=100)
    RAG_SCORE_THRESHOLD: float = Field(default=0.35, ge=-1, le=1, allow_inf_nan=False)
    RAG_MAX_CHUNKS_PER_ARTICLE: int = Field(default=3, ge=1, le=100)
    RAG_MAX_CONTEXT_CHARS: int = Field(default=16000, ge=256)
    model_config = SettingsConfigDict(env_file=".env")

    @model_validator(mode="after")
    def validate_retrieval_limits(self):
        if self.RAG_CANDIDATE_LIMIT < self.RAG_TOP_K:
            raise ValueError("RAG_CANDIDATE_LIMIT must be at least RAG_TOP_K")
        if self.RAG_MAX_CONTEXT_CHARS > self.MAX_CONTEXT_CHARS:
            raise ValueError("RAG_MAX_CONTEXT_CHARS must not exceed MAX_CONTEXT_CHARS")
        return self

    def service_api_key(self) -> str:
        key = (
            Path(self.AI_SERVICE_API_KEY_FILE).read_text().strip()
            if self.AI_SERVICE_API_KEY_FILE else self.AI_SERVICE_API_KEY
        )
        if len(key) < 32:
            raise ValueError("Configure an AI service API key of at least 32 characters")
        return key


@lru_cache
def get_settings() -> Settings:
    return Settings()
