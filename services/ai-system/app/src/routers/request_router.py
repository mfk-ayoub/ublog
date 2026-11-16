import logging
from contextlib import AsyncExitStack

from anyio import move_on_after
from fastapi import APIRouter, Depends, HTTPException, Request, status
from src.config.settings import Settings, get_settings
from src.embedding.Embedding import Embedding
from src.llm.get_provider import get_groq_provider
from src.llm.GroqProvider import GroqProvider
from src.models.ProccessRequest import DeleteRequest, ProccessRequest
from src.services.project_service import ProjectService
from src.services.vectordatabase import VectorService
from src.utils.chunking import ChunkingService

logger = logging.getLogger(__name__)
request_router = APIRouter(prefix="/api/data")


async def _close_client(client):
    """Cleanup failures must not mask an operation error or cancellation."""
    try:
        with move_on_after(5, shield=True):
            await client.aclose()
    except Exception:
        logger.warning("Could not close request client", exc_info=True)


async def _index_article(
    req: ProccessRequest,
    request: Request,
    settings: Settings,
    groq_provider: GroqProvider,
    updating: bool = False,
):
    try:
        is_safe = await groq_provider.moderate_content(
                    f"{req.title}\n\n{req.content}\n\nCategories: {', '.join(req.categories)}"
                )
        if type(is_safe) is not bool:
            raise ValueError("Moderation must return a boolean")
    except Exception:
        logger.exception("Article moderation failed")
        raise HTTPException(
            status_code=503, detail="Content moderation is temporarily unavailable."
        ) from None
    if not is_safe:
        raise HTTPException(
            status_code=403,
            detail={"flag": False, "message": "Content is unsafe."},
        )

    storage_started = False
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
            project_service = ProjectService(request.app.db)
            chunking_service = ChunkingService(request.app.db)
            chunks_models = chunking_service.create_chunks(req.article_id, req.content)
            chunks = [chunk.content for chunk in chunks_models]
            if not chunks:
                raise ValueError("Article produced no chunks")
            embedding_values = await embed_service.generate_embeddings(chunks)
            if len(embedding_values) != len(chunks):
                raise ValueError("Embedding count does not match chunk count")
            exists = updating and await project_service.check_project_exists(
                req.article_id
            )

            storage_started = True
            await project_service.store_project(req.model_dump())
            await chunking_service.delete_chunks_by_article_id(req.article_id)
            await chunking_service.store_chunks(chunks_models)
            await vecdb_service.insert_points(
                article_id=str(req.article_id),
                chunks_content=chunks,
                chunks_embedding=embedding_values,
                title=req.title,
            )
    except Exception:
        logger.exception(
            "Article indexing failed; storage started: %s", storage_started
        )
        detail = (
            "Article storage did not complete; partial changes may remain. Retry the request."
            if storage_started
            else "Article indexing is temporarily unavailable."
        )
        raise HTTPException(status_code=503, detail=detail) from None

    return {
        "message": "Article updated successfully"
        if exists
        else "Article created and indexed"
    }


@request_router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_article(
    req: ProccessRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
    groq_provider: GroqProvider = Depends(get_groq_provider),
):
    return await _index_article(req, request, settings, groq_provider)


@request_router.put("/update", status_code=status.HTTP_201_CREATED)
async def update_article(
    req: ProccessRequest,
    request: Request,
    settings: Settings = Depends(get_settings),
    groq_provider: GroqProvider = Depends(get_groq_provider),
):
    return await _index_article(req, request, settings, groq_provider, updating=True)


@request_router.delete("/delete", status_code=status.HTTP_200_OK)
async def delete_article(
    request: Request,
    deletereq: DeleteRequest,
    settings: Settings = Depends(get_settings),
):
    """Remove all article vectors, including orphans and older embedding models."""
    storage_started = False
    try:
        async with AsyncExitStack() as stack:
            vecdb_service = VectorService(
                qdrant_url=settings.QDRANT_URL,
                collection_name=getattr(
                    settings, "QDRANT_COLLECTION", "article_chunks"
                ),
                api_key=getattr(settings, "QDRANT_API_KEY", None),
                timeout_seconds=getattr(settings, "PROVIDER_TIMEOUT_SECONDS", 60.0),
            )
            stack.push_async_callback(_close_client, vecdb_service)
            storage_started = True
            await vecdb_service.delete_article(article_id=str(deletereq.article_id))
            await ChunkingService(request.app.db).delete_chunks_by_article_id(
                deletereq.article_id
            )
            await ProjectService(request.app.db).delete_project_by_id(
                deletereq.article_id
            )
    except Exception:
        logger.exception(
            "Article deletion failed; storage started: %s", storage_started
        )
        detail = (
            "Article deletion did not complete; partial changes may remain. Retry the request."
            if storage_started
            else "Article deletion is temporarily unavailable."
        )
        raise HTTPException(status_code=503, detail=detail) from None
    return {"message": "Article deleted successfully"}
