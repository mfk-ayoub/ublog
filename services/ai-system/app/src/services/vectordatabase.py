"""Async, non-destructive storage and retrieval of article chunk embeddings."""

import asyncio
import hashlib
import json
import math
from collections.abc import Sequence
from numbers import Real
from uuid import NAMESPACE_URL, UUID, uuid5

from qdrant_client import AsyncQdrantClient
from qdrant_client.http.exceptions import UnexpectedResponse
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PayloadSchemaType,
    PointStruct,
    UpdateStatus,
    VectorParams,
)


class VectorService:
    """Store revisions without deleting the previous revision before a successful upsert.

    Writers must serialize indexing and deletion for each article across all service
    instances, including retries. Qdrant's upsert followed by stale-revision deletion
    is not a transaction: readers can temporarily see both revisions, and concurrent
    writers can delete each other's work. Explicit revision identifiers must be
    immutable for a given article, embedding model, title and ordered chunk content.
    """

    def __init__(
        self,
        qdrant_url: str,
        collection_name: str = "article_chunks",
        api_key: str | None = None,
        timeout_seconds: float = 30,
        dimensions: int | None = None,
        embedding_model: str | None = None,
    ):
        if not isinstance(collection_name, str) or not collection_name.strip():
            raise ValueError("collection_name must be a non-empty string")
        if (
            isinstance(timeout_seconds, bool)
            or not isinstance(timeout_seconds, Real)
            or not math.isfinite(timeout_seconds)
            or timeout_seconds <= 0
        ):
            raise ValueError("timeout_seconds must be finite and positive")
        if dimensions is not None and (
            isinstance(dimensions, bool)
            or not isinstance(dimensions, int)
            or dimensions <= 0
        ):
            raise ValueError("dimensions must be a positive integer")
        if embedding_model is not None:
            self._nonempty_string(embedding_model, "embedding_model")
        self.qdrant = AsyncQdrantClient(
            url=qdrant_url, api_key=api_key, timeout=float(timeout_seconds)
        )
        self.collection_name = collection_name
        self.dimensions = dimensions
        self.embedding_model = embedding_model
        self._collection_lock = asyncio.Lock()

    @staticmethod
    def _nonempty_string(value: str, name: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{name} must be a non-empty string")
        return value

    @classmethod
    def _article_id(cls, value: str | UUID) -> str:
        return cls._nonempty_string(
            str(value) if isinstance(value, UUID) else value, "article_id"
        )

    @staticmethod
    def _sequence(value, name: str) -> None:
        if not isinstance(value, Sequence) or isinstance(value, (str, bytes)):
            raise TypeError(f"{name} must be a sequence")

    def _vector(self, values: Sequence[float]) -> list[float]:
        self._sequence(values, "embedding")
        if not values:
            raise ValueError("embedding must not be empty")
        vector = []
        for value in values:
            if isinstance(value, bool) or not isinstance(value, Real):
                raise TypeError("embedding values must be finite numbers")
            try:
                number = float(value)
            except (OverflowError, ValueError) as exc:
                raise ValueError("embedding values must be finite numbers") from exc
            if not math.isfinite(number):
                raise ValueError("embedding values must be finite numbers")
            vector.append(number)
        if self.dimensions is not None and len(vector) != self.dimensions:
            raise ValueError(
                f"Embedding dimension {len(vector)} does not match configured dimension {self.dimensions}"
            )
        return vector

    def _validate_collection(self, info, vector_size: int) -> None:
        config = info.config.params.vectors
        if (
            not isinstance(config, VectorParams)
            or config.multivector_config is not None
        ):
            raise ValueError("Collection must use a single unnamed dense vector")
        if config.size != vector_size or config.distance != Distance.COSINE:
            raise ValueError(
                f"Collection {self.collection_name!r} requires size={vector_size}, "
                f"distance=Cosine; found size={config.size}, distance={config.distance}. "
                "Use a different collection or migrate it explicitly; no data was deleted."
            )

    async def create_collection_if_not_exists(self, vector_size: int) -> None:
        """Create or validate a collection; never recreate an incompatible collection."""
        if (
            isinstance(vector_size, bool)
            or not isinstance(vector_size, int)
            or vector_size <= 0
        ):
            raise ValueError("vector_size must be a positive integer")
        if self.dimensions is not None and vector_size != self.dimensions:
            raise ValueError("vector_size does not match configured dimensions")
        async with self._collection_lock:
            try:
                info = await self.qdrant.get_collection(self.collection_name)
            except UnexpectedResponse as exc:
                if exc.status_code != 404:
                    raise
                try:
                    await self.qdrant.create_collection(
                        collection_name=self.collection_name,
                        vectors_config=VectorParams(
                            size=vector_size, distance=Distance.COSINE
                        ),
                    )
                except UnexpectedResponse as create_exc:
                    already_exists = create_exc.status_code == 409 or (
                        create_exc.status_code == 400
                        and "already exists" in str(create_exc).lower()
                    )
                    if not already_exists:
                        raise
                info = await self.qdrant.get_collection(self.collection_name)
            self._validate_collection(info, vector_size)
            for field in ("article_id", "revision", "embedding_model"):
                index = (info.payload_schema or {}).get(field)
                if index is not None:
                    if index.data_type != PayloadSchemaType.KEYWORD:
                        raise ValueError(
                            f"Payload index {field!r} must use keyword type"
                        )
                    continue
                await self.qdrant.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field,
                    field_schema=PayloadSchemaType.KEYWORD,
                    wait=True,
                )

    def _conditions(self, article_id: str | None = None) -> list[FieldCondition]:
        conditions = []
        if article_id is not None:
            conditions.append(
                FieldCondition(key="article_id", match=MatchValue(value=article_id))
            )
        if self.embedding_model is not None:
            conditions.append(
                FieldCondition(
                    key="embedding_model", match=MatchValue(value=self.embedding_model)
                )
            )
        return conditions

    async def insert_points(
        self,
        article_id: str,
        chunks_content: Sequence[str],
        chunks_embedding: Sequence[Sequence[float]],
        title: str | None = None,
        revision: str | None = None,
    ) -> None:
        """Index a complete immutable revision, then remove older article revisions.

        Empty paired inputs are a no-op, not an article deletion. Without an explicit
        revision, the ordered content, title and embedding model determine its hash.
        A failed cleanup can be retried with the same inputs and stable point IDs.
        The caller must serialize all writes to this article (see the class docstring).
        """
        article_id = self._article_id(article_id)
        self._sequence(chunks_content, "chunks_content")
        self._sequence(chunks_embedding, "chunks_embedding")
        if len(chunks_content) != len(chunks_embedding):
            raise ValueError("Chunk content and embedding counts must match")
        if title is not None and not isinstance(title, str):
            raise ValueError("title must be a string or None")
        if revision is not None:
            self._nonempty_string(revision, "revision")
        for chunk in chunks_content:
            self._nonempty_string(chunk, "chunk content")
        vectors = [self._vector(vector) for vector in chunks_embedding]
        if not vectors:
            return
        vector_size = len(vectors[0])
        if any(len(vector) != vector_size for vector in vectors):
            raise ValueError("All chunk embeddings must have the same dimension")
        if revision is None:
            content = json.dumps(
                [list(chunks_content), title, self.embedding_model],
                ensure_ascii=False,
                separators=(",", ":"),
            )
            revision = hashlib.sha256(content.encode("utf-8")).hexdigest()
        points = [
            PointStruct(
                id=str(
                    uuid5(
                        NAMESPACE_URL,
                        json.dumps(
                            [
                                self.collection_name,
                                article_id,
                                self.embedding_model,
                                revision,
                                index,
                            ],
                            separators=(",", ":"),
                        ),
                    )
                ),
                vector=vector,
                payload={
                    "article_id": article_id,
                    "content": chunk,
                    "chunk_index": index,
                    "title": title,
                    "revision": revision,
                    "embedding_model": self.embedding_model,
                },
            )
            for index, (chunk, vector) in enumerate(zip(chunks_content, vectors))
        ]
        await self.create_collection_if_not_exists(vector_size)
        result = await self.qdrant.upsert(
            collection_name=self.collection_name, points=points, wait=True
        )
        if result.status != UpdateStatus.COMPLETED:
            raise RuntimeError(
                "Qdrant upsert did not complete; previous revisions were retained"
            )
        await self.qdrant.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=self._conditions(article_id),
                must_not=[
                    FieldCondition(key="revision", match=MatchValue(value=revision))
                ],
            ),
            wait=True,
        )

    async def delete_article(self, article_id: str) -> None:
        """Delete the article within the configured model scope, if any."""
        article_id = self._article_id(article_id)
        try:
            await self.qdrant.delete(
                collection_name=self.collection_name,
                points_selector=Filter(must=self._conditions(article_id)),
                wait=True,
            )
        except UnexpectedResponse as exc:
            if exc.status_code != 404:
                raise

    async def search_sources(
        self,
        query_embedding: Sequence[float],
        limit: int = 5,
        article_id: str | None = None,
        score_threshold: float = 0.35,
    ) -> list[dict]:
        """Return chunk payload metadata plus point ID and cosine score, without writes."""
        vector = self._vector(query_embedding)
        if isinstance(limit, bool) or not isinstance(limit, int) or limit <= 0:
            raise ValueError("limit must be a positive integer")
        if (
            isinstance(score_threshold, bool)
            or not isinstance(score_threshold, Real)
            or not math.isfinite(score_threshold)
            or not -1 <= score_threshold <= 1
        ):
            raise ValueError(
                "score_threshold must be a finite cosine score between -1 and 1"
            )
        if article_id is not None:
            article_id = self._article_id(article_id)
        conditions = self._conditions(article_id)
        try:
            info = await self.qdrant.get_collection(self.collection_name)
            self._validate_collection(info, len(vector))
            result = await self.qdrant.query_points(
                collection_name=self.collection_name,
                query=vector,
                query_filter=Filter(must=conditions) if conditions else None,
                limit=limit,
                score_threshold=float(score_threshold),
                with_payload=True,
                with_vectors=False,
            )
        except UnexpectedResponse as exc:
            if exc.status_code == 404:
                return []
            raise
        return [
            {**(hit.payload or {}), "id": str(hit.id), "score": float(hit.score)}
            for hit in result.points
        ]

    async def search(
        self,
        query_embedding: Sequence[float],
        limit: int = 5,
        article_id: str | None = None,
        score_threshold: float = 0.35,
    ) -> list[str]:
        """Compatibility wrapper returning only source texts."""
        sources = await self.search_sources(
            query_embedding, limit, article_id, score_threshold
        )
        return [
            source["content"]
            for source in sources
            if isinstance(source.get("content"), str)
        ]

    async def aclose(self) -> None:
        await self.qdrant.close()
