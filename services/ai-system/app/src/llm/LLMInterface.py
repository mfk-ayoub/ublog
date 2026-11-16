from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator

from src.models.ModerationResult import ModerationResult


class LLMInterface(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str) -> str:
        """Generate text or raise on unavailable, empty, or incomplete output."""
        raise NotImplementedError

    @abstractmethod
    def summarize_text_stream(self, text: str) -> AsyncGenerator[str, None]:
        """Summarize all input, yielding text and propagating provider failures."""
        raise NotImplementedError

    @abstractmethod
    def llm_query_stream(
        self, question: str, context_chunks: list[str] | None = None
    ) -> AsyncGenerator[str, None]:
        """None selects general chat; a list requires grounded answers with citations."""
        raise NotImplementedError

    @abstractmethod
    async def moderate_content_result(self, text: str, info: str = "") -> ModerationResult:
        """Return a validated verdict or raise ModerationUnavailable, never a fallback verdict."""
        raise NotImplementedError

    async def moderate_content(self, text: str, info: str = "") -> bool:
        """Compatibility API: True is safe, False is unsafe; outages still raise."""
        return (await self.moderate_content_result(text, info)).safe
