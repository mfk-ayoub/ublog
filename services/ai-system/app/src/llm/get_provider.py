from typing import Annotated

from fastapi import Depends, HTTPException, Request
from src.config.settings import Settings, get_settings
from src.llm.GroqProvider import GroqProvider


async def get_groq_provider(
    request: Request, settings: Annotated[Settings, Depends(get_settings)]
) -> GroqProvider:
    """One remote client per application; the application lifespan owns its close."""
    provider = getattr(request.app.state, "groq_provider", None)
    if provider is not None:
        return provider
    if not settings.GROQ_API_KEY or not settings.GROQ_API_KEY.strip():
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured")
    provider = GroqProvider(
        api_key=settings.GROQ_API_KEY,
        model_name=getattr(settings, "GROQ_MODEL", "llama-3.3-70b-versatile"),
        moderation_model=getattr(settings, "GROQ_MODERATION_MODEL", None),
        timeout_seconds=getattr(settings, "PROVIDER_TIMEOUT_SECONDS", 60.0),
        max_tokens=getattr(settings, "LLM_MAX_TOKENS", 2048),
        moderation_chunk_size=getattr(settings, "MODERATION_CHUNK_SIZE", 6000),
        summary_chunk_size=getattr(settings, "SUMMARY_CHUNK_SIZE", 12000),
        max_context_chars=getattr(settings, "MAX_CONTEXT_CHARS", 24000),
    )
    request.app.state.groq_provider = provider
    return provider
