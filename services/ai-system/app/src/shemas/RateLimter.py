from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, timezone

class RateLimter(BaseModel):
    user_id: UUID
    request_count: int = 0    
    last_request: float = Field(default_factory=lambda: datetime.now(timezone.utc).timestamp())
