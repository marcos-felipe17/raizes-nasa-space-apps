"""UC-15: generate only from server-audited regional sequences."""

import re
from collections.abc import Sequence
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from .candidate_crops import CandidateCropsInput, CandidateCropsStatus
from .history import CultivationPeriod
from .rotation_proposal import RotationProposalInput


class RegionBounds(BaseModel):
    model_config = ConfigDict(extra="forbid")
    south: float = Field(ge=-90, le=90)
    north: float = Field(ge=-90, le=90)
    west: float = Field(ge=-180, le=180)
    east: float = Field(ge=-180, le=180)

    @model_validator(mode="after")
    def validate_bounds(self) -> "RegionBounds":
        if self.south >= self.north or self.west >= self.east:
            raise ValueError("Invalid region bounds")
        return self

    def contains(self, latitude: float, longitude: float) -> bool:
        return self.south <= latitude <= self.north and self.west <= longitude <= self.east


class VerifiedRegion(BaseModel):
    """Add a record only after auditing location, crop sequence, dates and source."""

    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=2)
    name: str = Field(min_length=2)
    bounds: RegionBounds
    source_url: str = Field(pattern=r"^https://")
    source_version: str = Field(min_length=2)
    sequences: list[RotationProposalInput] = Field(min_length=1)


# No real context has yet passed the required audit of parcel, calendar and rules.
VERIFIED_REGIONS: tuple[VerifiedRegion, ...] = ()


class AlternativeGenerationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    proposal: RotationProposalInput
    candidate_crops: CandidateCropsInput


class GeneratedAlternative(BaseModel):
    seasons: list[CultivationPeriod]
    context_id: str
    context_name: str
    source_url: str
    source_version: str
    status: Literal["explore_only"] = "explore_only"
    reason: str = "Sequência documentada para o contexto verificado; adequação da parcela ainda não avaliada."


class AlternativeGenerationResult(BaseModel):
    status: Literal["generated", "blocked"]
    reason: str
    alternatives: list[GeneratedAlternative]
    missing_for_generation: list[str]


def _crop_key(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip()).casefold()


def _same_sequence(a: RotationProposalInput, b: RotationProposalInput) -> bool:
    return all(
        _crop_key(left.crop) == _crop_key(right.crop)
        and left.start_month == right.start_month
        and left.end_month == right.end_month
        for left, right in zip(a.seasons, b.seasons, strict=True)
    )


def generate_alternatives(
    payload: AlternativeGenerationInput,
    regions: Sequence[VerifiedRegion] = VERIFIED_REGIONS,
) -> AlternativeGenerationResult:
    """Return sourced sequences only; user-supplied flags cannot certify a region."""
    matches = [
        item for item in regions if item.bounds.contains(payload.latitude, payload.longitude)
    ]
    region = matches[0] if len(matches) == 1 else None
    missing = []
    if region is None:
        missing.append("verified_region_rules")
    if payload.candidate_crops.status == CandidateCropsStatus.UNKNOWN:
        missing.append("candidate_crops")
    if missing:
        return AlternativeGenerationResult(
            status="blocked",
            reason="Faltam condições verificadas para gerar alternativas nesta área.",
            alternatives=[], missing_for_generation=missing,
        )

    assert region is not None
    candidates = {_crop_key(crop) for crop in payload.candidate_crops.crops}
    alternatives = []
    for sequence in region.sequences:
        first, second = sequence.seasons
        if _crop_key(first.crop) == _crop_key(second.crop):
            continue
        if any(_crop_key(season.crop) not in candidates for season in sequence.seasons):
            continue
        if _same_sequence(sequence, payload.proposal):
            continue
        alternatives.append(GeneratedAlternative(
            seasons=sequence.seasons,
            context_id=region.id,
            context_name=region.name,
            source_url=region.source_url,
            source_version=region.source_version,
        ))
        if len(alternatives) == 5:
            break

    if not alternatives:
        return AlternativeGenerationResult(
            status="blocked",
            reason="Nenhuma sequência documentada diferente da proposta corresponde às culturas candidatas neste contexto.",
            alternatives=[], missing_for_generation=["applicable_sequence"],
        )
    return AlternativeGenerationResult(
        status="generated", reason="Alternativas documentadas para explorar; nenhuma foi aprovada para a parcela.",
        alternatives=alternatives, missing_for_generation=[],
    )
