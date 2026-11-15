"""UC-10: a farmer-proposed sequence of exactly two crop seasons."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .history import CultivationPeriod


class RotationProposalInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    seasons: list[CultivationPeriod] = Field(min_length=2, max_length=2)

    @model_validator(mode="after")
    def validate_order(self) -> "RotationProposalInput":
        if self.seasons[1].start_month <= self.seasons[0].start_month:
            raise ValueError("The second season must start after the first")
        return self


class RotationProposalValidation(BaseModel):
    proposal: RotationProposalInput
    analysis_performed: Literal[False] = False


def validate_rotation_proposal(value: RotationProposalInput) -> RotationProposalValidation:
    """Preserve the proposed sequence without evaluating its agronomic suitability."""
    return RotationProposalValidation(proposal=value)
