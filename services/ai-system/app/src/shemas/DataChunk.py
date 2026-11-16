
from pydantic import BaseModel
from typing import List
from uuid import UUID

class DataChunk(BaseModel):
    id: UUID
    article_id: UUID
    chunk_index: int
    content: str
