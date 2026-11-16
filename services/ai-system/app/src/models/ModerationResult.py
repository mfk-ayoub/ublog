from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StrictBool,
    StrictStr,
    model_validator,
)


class ModerationUnavailable(RuntimeError):
    """Moderation could not produce a trustworthy verdict; retry or return HTTP 503."""


class ModerationResult(BaseModel):
    """A safe verdict has no categories; an unsafe verdict must explain its categories."""

    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)

    safe: StrictBool
    categories: list[StrictStr]
    reason: StrictStr = Field(min_length=1, max_length=2000)

    @model_validator(mode="after")
    def validate_verdict(self) -> "ModerationResult":
        if not self.reason.strip():
            raise ValueError("Moderation reason must not be blank")
        if any(not category.strip() or len(category) > 100 for category in self.categories):
            raise ValueError("Moderation categories must be nonblank labels of at most 100 characters")
        if len({category.strip().casefold() for category in self.categories}) != len(self.categories):
            raise ValueError("Moderation categories must be unique")
        if self.safe != (len(self.categories) == 0):
            raise ValueError("Safe verdicts require no categories; unsafe verdicts require categories")
        return self
