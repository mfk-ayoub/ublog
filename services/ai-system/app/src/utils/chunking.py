from typing import List
from uuid import UUID, uuid4

from langchain_text_splitters import RecursiveCharacterTextSplitter
from motor.motor_asyncio import AsyncIOMotorDatabase
from src.shemas.DataChunk import DataChunk


class ChunkingService:
    def __init__(
        self, db: AsyncIOMotorDatabase, chunk_size: int = 500, chunk_overlap: int = 50
    ):
        self.db = db
        self.collection = db.chunks
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def create_chunks(self, article_id: UUID, content: str) -> List[DataChunk]:
        """Prepare all chunk models without changing storage."""
        return [
            DataChunk(
                id=uuid4(),
                article_id=article_id,
                chunk_index=index,
                content=text,
            )
            for index, text in enumerate(self.text_splitter.split_text(content))
            if text.strip()
        ]

    async def store_chunks(self, chunks: List[DataChunk]) -> None:
        if chunks:
            await self.collection.insert_many(
                [chunk.model_dump(mode="json") for chunk in chunks]
            )

    async def create_and_store_chunks(
        self, article_id: UUID, content: str
    ) -> List[DataChunk]:
        chunks = self.create_chunks(article_id, content)
        await self.store_chunks(chunks)
        return chunks

    async def get_chunks_by_article_id(self, article_id: UUID) -> List[DataChunk]:
        cursor = self.collection.find({"article_id": str(article_id)}).sort(
            "chunk_index", 1
        )
        return [DataChunk(**chunk) async for chunk in cursor]

    async def delete_chunks_by_article_id(self, article_id: UUID) -> None:
        await self.collection.delete_many({"article_id": str(article_id)})

    async def update_chunks(self, article_id: UUID, content: str) -> List[DataChunk]:
        chunks = self.create_chunks(article_id, content)
        await self.delete_chunks_by_article_id(article_id)
        await self.store_chunks(chunks)
        return chunks
