from contextlib import aclosing
from typing import AsyncGenerator, List
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorDatabase
from src.llm.GroqProvider import GroqProvider
from src.services.project_service import ProjectService
from src.utils.chunking import ChunkingService


class LLMService:
    def __init__(self, db: AsyncIOMotorDatabase, groq_provider: GroqProvider):
        self.db = db
        self.chunking_service = ChunkingService(db)
        self.llm = groq_provider

    async def query_article_stream(
        self, article_id: UUID, question: str, max_chunks: int = 5
    ) -> AsyncGenerator[str, None]:
        chunks = await self.chunking_service.get_chunks_by_article_id(article_id)
        if not chunks:
            yield "No information available for this article"
            return
        context_chunks = [chunk.content for chunk in chunks[:max_chunks]]
        async with aclosing(
            self.generate_rag_response(question, context_chunks)
        ) as stream:
            async for token in stream:
                yield token

    async def query_question_stream(self, question: str) -> AsyncGenerator[str, None]:
        async with aclosing(self.llm.llm_query_stream(question, None)) as stream:
            async for token in stream:
                yield token

    async def summarize_article_stream(
        self, article_id: UUID
    ) -> AsyncGenerator[str, None]:
        project = await ProjectService(self.db).get_project_by_id(article_id)
        if project is None:
            yield "No content to summarize"
            return
        async with aclosing(self.summarize_text_stream(project.content)) as stream:
            async for token in stream:
                yield token

    async def summarize_text_stream(self, text: str) -> AsyncGenerator[str, None]:
        async with aclosing(self.llm.summarize_text_stream(text)) as stream:
            async for token in stream:
                yield token

    async def generate_rag_response(
        self, question: str, relevant_chunks: List[str]
    ) -> AsyncGenerator[str, None]:
        async with aclosing(
            self.llm.llm_query_stream(question, relevant_chunks)
        ) as stream:
            async for token in stream:
                yield token
