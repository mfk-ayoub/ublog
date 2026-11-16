import asyncio
import math
from numbers import Real

from google import genai
from google.genai import types
from langchain_text_splitters import RecursiveCharacterTextSplitter


class EmbeddingUnavailable(RuntimeError):
    """The embedding service failed or returned invalid vectors."""


class Embedding:
    def __init__(
        self,
        api_key: str,
        model_name: str = "gemini-embedding-001",
        dimensions: int = 768,
        batch_size: int = 100,
        timeout_seconds: float = 60.0,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
    ):
        if not isinstance(api_key, str) or not api_key.strip():
            raise ValueError("A Gemini API key is required")
        if not isinstance(model_name, str) or not model_name.strip():
            raise ValueError("An embedding model is required")
        for name, value in (
            ("dimensions", dimensions), ("batch_size", batch_size), ("chunk_size", chunk_size)
        ):
            if type(value) is not int or value < 1:
                raise ValueError(f"{name} must be a positive integer")
        if batch_size > 100:
            raise ValueError("Gemini embedding batches must contain at most 100 inputs")
        if not math.isfinite(timeout_seconds) or timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be finite and positive")
        if type(chunk_overlap) is not int or not 0 <= chunk_overlap < chunk_size:
            raise ValueError("chunk_overlap must be nonnegative and smaller than chunk_size")
        self.model_name = model_name
        self.dimensions = dimensions
        self.batch_size = batch_size
        self.timeout_seconds = timeout_seconds
        self.client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=max(1, math.ceil(timeout_seconds * 1000))),
        )
        self.async_client = self.client.aio
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        self._closed = False

    async def _embed(self, contents: list[str], task_type: str) -> list[list[float]]:
        if self._closed:
            raise EmbeddingUnavailable("Embedding client is closed")
        if not isinstance(contents, list) or any(
            not isinstance(text, str) or not text.strip() for text in contents
        ):
            raise ValueError("contents must be a list of nonblank strings")
        vectors = []
        for offset in range(0, len(contents), self.batch_size):
            batch = contents[offset:offset + self.batch_size]
            try:
                response = await asyncio.wait_for(
                    self.async_client.models.embed_content(
                        model=self.model_name,
                        contents=batch,
                        config=types.EmbedContentConfig(
                            task_type=task_type,
                            output_dimensionality=self.dimensions,
                        ),
                    ),
                    timeout=self.timeout_seconds,
                )
                if response.embeddings is None or len(response.embeddings) != len(batch):
                    raise ValueError("Embedding count does not match input count")
                for item in response.embeddings:
                    values = item.values
                    if values is None or len(values) != self.dimensions:
                        raise ValueError("Embedding dimension does not match configuration")
                    if any(
                        isinstance(value, bool)
                        or not isinstance(value, Real)
                        or not math.isfinite(value)
                        for value in values
                    ):
                        raise ValueError("Embedding contains non-finite or nonnumeric values")
                    vectors.append([float(value) for value in values])
            except Exception as exc:
                raise EmbeddingUnavailable("Gemini embeddings unavailable or invalid") from exc
        return vectors

    async def generate_embeddings(self, contents: list[str]) -> list[list[float]]:
        """Embed retrieval documents in ordered async batches; [] returns []."""
        return await self._embed(contents, "RETRIEVAL_DOCUMENT")

    async def generate_query_embedding(self, query: str) -> list[float]:
        """Embed a search query separately from documents in the same vector space."""
        return (await self._embed([query], "RETRIEVAL_QUERY"))[0]

    async def chunking_text(self, text: str) -> list[str]:
        return self.text_splitter.split_text(text)

    async def aclose(self) -> None:
        if not self._closed:
            await asyncio.wait_for(self.async_client.aclose(), timeout=self.timeout_seconds)
            self.client.close()
            self._closed = True
