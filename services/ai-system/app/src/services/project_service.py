from typing import Any, Dict, Optional
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorDatabase
from src.shemas.Project import Project


class ProjectService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.projects

    async def check_project_exists(self, project_id: UUID) -> bool:
        existing = await self.collection.find_one({"project_id": str(project_id)})
        return existing is not None

    async def store_project(self, project_data: Dict[str, Any]) -> Project:
        """Upsert the article so retries do not insert another project document."""
        project = Project(
            project_id=project_data["article_id"],
            title=project_data["title"],
            content=project_data["content"],
            categories=project_data["categories"],
        )
        project_dict = project.model_dump(mode="json")
        await self.collection.update_one(
            {"project_id": project_dict["project_id"]},
            {
                            "$set": project_dict,
                            "$setOnInsert": {"_id": project_dict["project_id"]},
                        },
                        upsert=True,
        )
        return project

    async def get_project_by_id(self, project_id: UUID) -> Optional[Project]:
        project_dict = await self.collection.find_one(
            {"project_id": str(project_id)}, {"_id": 0}
        )
        return Project(**project_dict) if project_dict else None

    async def delete_project_by_id(self, project_id: UUID) -> None:
        await self.collection.delete_one({"project_id": str(project_id)})

    async def update_project_data(self, project_data: Dict[str, Any]) -> Project:
        return await self.store_project(project_data)
