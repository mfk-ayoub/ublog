import hmac
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient

from src.config.settings import get_settings
from src.routers.request_router import request_router
from src.routers.response_router import response_router


async def require_service_key(x_ai_service_key: str | None = Header(default=None)):
    expected = get_settings().service_api_key()
    if x_ai_service_key is None or not hmac.compare_digest(
        x_ai_service_key.encode(), expected.encode()
    ):
        raise HTTPException(status_code=401, detail="Invalid service credentials")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    settings.service_api_key()
    app.mongodb_client = AsyncIOMotorClient(
        settings.MONGODB_URL, serverSelectionTimeoutMS=10000,
    )
    app.db = app.mongodb_client[settings.MONGODB_DATABASE]
    try:
        await app.db.command("ping")
        await app.db.projects.create_index("project_id", unique=True)
        await app.db.chunks.create_index([("article_id", 1), ("chunk_index", 1)])
        await app.db.rate_limits.create_index("expires_at", expireAfterSeconds=0)
        yield
    finally:
        try:
            provider = getattr(app.state, "groq_provider", None)
            if provider is not None:
                await provider.async_client.close()
                app.state.groq_provider = None
        finally:
            app.mongodb_client.close()


app = FastAPI(lifespan=lifespan, dependencies=[Depends(require_service_key)])
app.include_router(request_router)
app.include_router(response_router)
