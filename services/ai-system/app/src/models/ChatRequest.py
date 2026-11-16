from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=8_000)
    user_id: UUID
    article_id: Optional[UUID] = None

    @field_validator("question")
    @classmethod
    def reject_blank_question(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Question must not be blank")
        return value.strip()


class ChatResponse(BaseModel):
    answer: str


class SummarizeRequest(BaseModel):
    article_id: UUID
    user_id: UUID
