"""Atomic MongoDB-backed quotas partitioned by user and UTC calendar day."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError


class RateLimiter:
    """Consume quota with one conditional write and MongoDB's unique `_id` index.

    Application startup must configure a TTL index on `expires_at` with
    `expireAfterSeconds=0`. Buckets expire seven days after their UTC midnight;
    correctness does not depend on when MongoDB's asynchronous TTL cleanup runs.
    """

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.rate_limits

    async def check_request(self, user_id: UUID | str, daily_limit: int = 10) -> bool:
        if isinstance(daily_limit, bool) or not isinstance(daily_limit, int):
            raise TypeError("daily_limit must be an integer")
        if daily_limit <= 0:
            return False
        if isinstance(user_id, UUID):
            user_id = str(user_id)
        if not isinstance(user_id, str) or not user_id.strip():
            raise ValueError("user_id must be a UUID or a non-empty string")
        now = datetime.now(UTC)
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        day = day_start.date().isoformat()
        try:
            record = await self.collection.find_one_and_update(
                {
                    "_id": f"{user_id}:{day}",
                    "request_count": {"$lt": daily_limit},
                },
                {
                    "$inc": {"request_count": 1},
                    "$set": {"last_request": now.timestamp()},
                    "$setOnInsert": {
                        "user_id": user_id,
                        "date": day,
                        "expires_at": day_start + timedelta(days=7),
                    },
                },
                upsert=True,
                return_document=ReturnDocument.AFTER,
            )
        except DuplicateKeyError:
            return False
        return record is not None
