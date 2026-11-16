import math
import re
from collections import Counter
from uuid import UUID

from src.config.settings import Settings
from src.embedding.Embedding import Embedding
from src.services.vectordatabase import VectorService


class RAGService:
    def __init__(
        self, embedding: Embedding, vectors: VectorService, settings: Settings
    ):
        self.embedding = embedding
        self.vectors = vectors
        self.top_k = getattr(settings, "RAG_TOP_K", 5)
        self.candidate_limit = max(
            self.top_k, getattr(settings, "RAG_CANDIDATE_LIMIT", 20)
        )
        self.score_threshold = getattr(settings, "RAG_SCORE_THRESHOLD", 0.35)
        self.per_article = getattr(settings, "RAG_MAX_CHUNKS_PER_ARTICLE", 3)
        self.max_context_chars = getattr(settings, "RAG_MAX_CONTEXT_CHARS", 16_000)

    @staticmethod
    def _fingerprint(content: str) -> tuple[str, set[tuple[str, ...]]]:
        normalized = " ".join(content.casefold().split())
        words = re.findall(r"\w+|[^\w\s]", normalized)
        shingles = {
            tuple(words[index:index + 5]) for index in range(len(words) - 4)
        }
        return normalized, shingles

    @staticmethod
    def _redundant(fingerprint, selected) -> bool:
        text, shingles = fingerprint
        for previous, previous_shingles in selected:
            if text == previous:
                return True
            significant = r"[+-]?\d+(?:[.,]\d+)*|\b(?:no|not|never|without|cannot)\b"
            if re.findall(significant, text) != re.findall(significant, previous):
                continue
            length_ratio = min(len(text), len(previous)) / max(len(text), len(previous))
            if length_ratio < 0.8:
                continue
            if text in previous or previous in text:
                return True
            if min(len(shingles), len(previous_shingles)) >= 8 and (
                len(shingles & previous_shingles)
                / min(len(shingles), len(previous_shingles)) >= 0.9
            ):
                return True
        return False

    async def retrieve_context(
        self, question: str, article_id: UUID | str | None = None
    ) -> list[str]:
        article_filter = str(article_id) if article_id is not None else None
        query_embedding = await self.embedding.generate_query_embedding(question)
        sources = await self.vectors.search_sources(
            query_embedding,
            limit=self.candidate_limit,
            article_id=article_filter,
            score_threshold=self.score_threshold,
        )
        candidates = []
        for source in sources:
            content = source.get("content")
            source_article = source.get("article_id")
            score = source.get("score")
            if (
                not isinstance(content, str)
                or not content.strip()
                or not isinstance(source_article, str)
                or not source_article.strip()
                or isinstance(score, bool)
                or not isinstance(score, (int, float))
                or not math.isfinite(score)
                or score < self.score_threshold
                or (article_filter is not None and source_article != article_filter)
            ):
                continue
            candidates.append(source)
        candidates.sort(key=lambda source: source["score"], reverse=True)

        context = []
        fingerprints = []
        seen_chunks = set()
        article_counts = Counter()
        remaining = self.max_context_chars
        for source in candidates:
            if len(context) >= self.top_k:
                break
            source_article = source["article_id"]
            if article_filter is None and article_counts[source_article] >= self.per_article:
                continue
            chunk_index = source.get("chunk_index")
            chunk_key = (source_article, chunk_index)
            valid_index = type(chunk_index) is int and chunk_index >= 0
            if valid_index and chunk_key in seen_chunks:
                continue
            content = source["content"].strip()
            fingerprint = self._fingerprint(content)
            if self._redundant(fingerprint, fingerprints):
                continue
            title = source.get("title")
            title = " ".join(title.split())[:500] if isinstance(title, str) else "Untitled"
            header = (
                f"Title: {title or 'Untitled'}\n"
                f"Article ID: {source_article[:128]}\n"
                f"Chunk: {chunk_index if valid_index else 'unknown'}\nPassage:\n"
            )
            available = remaining - len(header)
            if available < min(80, len(content)):
                continue
            excerpt = content[:available]
            if len(excerpt) < len(content) and " " in excerpt:
                excerpt = excerpt.rsplit(" ", 1)[0]
            if not excerpt.strip():
                continue
            context.append(header + excerpt)
            remaining -= len(context[-1])
            fingerprints.append(self._fingerprint(excerpt))
            article_counts[source_article] += 1
            if valid_index:
                seen_chunks.add(chunk_key)
        return context
