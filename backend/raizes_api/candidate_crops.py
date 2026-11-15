"""UC-06: crops the farmer is willing or able to consider for an area."""

from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


CropName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]


class CandidateCropsStatus(StrEnum):
    KNOWN = "known"
    UNKNOWN = "unknown"


class CandidateCropsInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: CandidateCropsStatus
    crops: list[CropName] = Field(default_factory=list, max_length=30)

    @model_validator(mode="after")
    def validate_consistency(self) -> "CandidateCropsInput":
        if self.status == CandidateCropsStatus.UNKNOWN:
            if self.crops:
                raise ValueError("Unknown candidate crops cannot contain crop names")
            return self
        if not self.crops:
            raise ValueError("Known candidate crops require at least one crop")
        normalized = [crop.casefold() for crop in self.crops]
        if len(normalized) != len(set(normalized)):
            raise ValueError("Candidate crops cannot contain duplicate names")
        return self


class CandidateCropsValidation(BaseModel):
    candidate_crops: CandidateCropsInput
    eligibility_evaluated: Literal[False] = False
    missing_for_analysis: list[str]


def validate_candidate_crops(value: CandidateCropsInput) -> CandidateCropsValidation:
    """Preserve input as candidates; agronomic eligibility is a later decision."""
    missing = ["candidate_crops"] if value.status == CandidateCropsStatus.UNKNOWN else []
    return CandidateCropsValidation(
        candidate_crops=value,
        missing_for_analysis=missing,
    )
