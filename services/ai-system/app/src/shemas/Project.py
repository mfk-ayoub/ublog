from pydantic import BaseModel, Field
from uuid import UUID
from typing import List

class Project(BaseModel):
    project_id: UUID = Field(...)
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    categories: List[str] = Field(..., min_items=1)
