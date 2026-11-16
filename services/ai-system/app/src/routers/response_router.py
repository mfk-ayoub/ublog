import asyncio
import logging
from contextlib import AsyncExitStack

from anyio import move_on_after
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from src.config.settings import Settings, get_settings
from src.embedding.Embedding import Embedding
from src.llm.get_provider import get_groq_provider
from src.llm.GroqProvider import GroqProvider
from src.models.ChatRequest import ChatRequest, SummarizeRequest
from src.services.llm_service import LLMService
from src.services.project_service import ProjectService
from src.services.rag_service import RAGService
from src.services.vectordatabase import VectorService
from src.utils.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)
response_router = APIRouter(prefix="/api/data")


async def _close_client(client):
    """Cleanup failures must not mask an operation error or cancellation."""
    try:
        with move_on_after(5, shield=True):
            await client.aclose()
    except Exception:
        logger.warning("Could not close response resource", exc_info=True)


async def stream_with_buffer(token_stream, chunk_size: int = 3, sleep: float = 0.009):
    buffer = ""
    try:
        async for token in token_stream:
            buffer += token
            if len(buffer) >= chunk_size or any(
                p in buffer for p in [". ", "! ", "? ", "\n"]
            ):
                yield buffer
                buffer = ""
                await asyncio.sleep(sleep)
    finally:
        await _close_client(token_stream)
    if buffer:
        yield buffer


def _stream_response(token_stream):
    async def generate():
        stream = stream_with_buffer(token_stream)
        try:
            async for chunk in stream:
                yield chunk
        except Exception:
            logger.exception("Response generation failed")
            yield "\nError: Response generation is temporarily unavailable.\n"
        finally:
            await _close_client(stream)

    return StreamingResponse(
        generate(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


async def _check_daily_limit(user_id, request: Request, settings: Settings):
    try:
        allowed = await RateLimiter(request.app.db).check_request(
            user_id, settings.NUMBER_OF_REQUESTS_PER_DAY
        )
    except Exception:
        logger.exception("Daily quota check failed")
        raise HTTPException(
            status_code=503, detail="Request quota is temporarily unavailable."
        ) from None
    if not allowed:
        raise HTTPException(
            status_code=429, detail="Daily request expired, try again tomorrow"
        )


@response_router.post("/ask")
async def rag_response(
    chat_req: ChatRequest,
    request: Request,
    groq_provider: GroqProvider = Depends(get_groq_provider),
    settings: Settings = Depends(get_settings),
):
    await _check_daily_limit(chat_req.user_id, request, settings)
    try:
        async with AsyncExitStack() as stack:
            embed_service = Embedding(
                api_key=settings.GEMINI_API_KEY,
                model_name=getattr(settings, "EMBEDDING_MODEL", "gemini-embedding-001"),
                dimensions=getattr(settings, "EMBEDDING_DIMENSIONS", 768),
                batch_size=getattr(settings, "EMBEDDING_BATCH_SIZE", 100),
                timeout_seconds=getattr(settings, "PROVIDER_TIMEOUT_SECONDS", 60.0),
            )
            stack.push_async_callback(_close_client, embed_service)
            vecdb_service = VectorService(
                qdrant_url=settings.QDRANT_URL,
                collection_name=getattr(
                    settings, "QDRANT_COLLECTION", "article_chunks"
                ),
                api_key=getattr(settings, "QDRANT_API_KEY", None),
                timeout_seconds=getattr(settings, "PROVIDER_TIMEOUT_SECONDS", 60.0),
                dimensions=getattr(settings, "EMBEDDING_DIMENSIONS", 768),
                embedding_model=getattr(
                    settings, "EMBEDDING_MODEL", "gemini-embedding-001"
                ),
            )
            stack.push_async_callback(_close_client, vecdb_service)
            relevant_chunks = await RAGService(
                embed_service, vecdb_service, settings
            ).retrieve_context(chat_req.question, chat_req.article_id)
    except Exception:
        logger.exception("Article retrieval failed")
        raise HTTPException(
            status_code=503, detail="Article retrieval is temporarily unavailable."
        ) from None

    llm_service = LLMService(request.app.db, groq_provider)
    return _stream_response(
        llm_service.generate_rag_response(chat_req.question, relevant_chunks)
    )


@response_router.post("/chat")
async def chat(
    chat_req: ChatRequest,
    request: Request,
    groq_provider: GroqProvider = Depends(get_groq_provider),
    settings: Settings = Depends(get_settings),
):
    await _check_daily_limit(chat_req.user_id, request, settings)
    llm_service = LLMService(request.app.db, groq_provider)
    return _stream_response(llm_service.query_question_stream(chat_req.question))


@response_router.post("/summarize")
async def summarize_article(
    srequest: SummarizeRequest,
    request: Request,
    groq_provider: GroqProvider = Depends(get_groq_provider),
    settings: Settings = Depends(get_settings),
):
    await _check_daily_limit(srequest.user_id, request, settings)
    try:
        project = await ProjectService(request.app.db).get_project_by_id(
            srequest.article_id
        )
    except Exception:
        logger.exception("Summary article lookup failed")
        raise HTTPException(
            status_code=503, detail="Article lookup is temporarily unavailable."
        ) from None
    if project is None:
        raise HTTPException(status_code=404, detail="Article not found.")
    llm_service = LLMService(request.app.db, groq_provider)
    return _stream_response(llm_service.summarize_text_stream(project.content))
