"""UC-16: compare the proposal with server-generated alternatives."""

from typing import Literal

from pydantic import BaseModel

from .alternatives import (
    AlternativeGenerationInput,
    AlternativeGenerationResult,
    VerifiedRegion,
    generate_alternatives,
)
from .candidate_crops import CandidateCropsStatus
from .history import CultivationPeriod
from .restrictions import RestrictionCheckInput, check_restrictions
from .rotation_proposal import RotationProposalInput


class ComparisonOption(BaseModel):
    kind: Literal["proposal", "alternative"]
    seasons: list[CultivationPeriod]
    state: Literal["excluded", "inconclusive"]
    state_reason: str
    distinct_crops: bool
    candidate_crops: Literal["all_listed", "some_unlisted", "unknown"]
    regional_source: Literal["documented", "not_documented"]
    source_url: str | None = None
    source_version: str | None = None
    context_name: str | None = None
    adequacy: Literal["unavailable"] = "unavailable"


class ComparisonResult(BaseModel):
    status: Literal["ready", "limited"]
    reason: str
    options: list[ComparisonOption]
    missing_for_comparison: list[str]


def _candidate_status(
    sequence: RotationProposalInput, payload: AlternativeGenerationInput,
) -> Literal["all_listed", "some_unlisted", "unknown"]:
    if payload.candidate_crops.status == CandidateCropsStatus.UNKNOWN:
        return "unknown"
    listed = {crop.strip().casefold() for crop in payload.candidate_crops.crops}
    return (
        "all_listed" if all(season.crop.strip().casefold() in listed for season in sequence.seasons)
        else "some_unlisted"
    )


def _option(
    kind: Literal["proposal", "alternative"], sequence: RotationProposalInput,
    payload: AlternativeGenerationInput, *, source_url: str | None = None,
    source_version: str | None = None, context_name: str | None = None,
) -> ComparisonOption:
    restriction = check_restrictions(RestrictionCheckInput(proposal=sequence))
    return ComparisonOption(
        kind=kind,
        seasons=sequence.seasons,
        state=restriction.status,
        state_reason=restriction.reason,
        distinct_crops=restriction.status != "excluded",
        candidate_crops=_candidate_status(sequence, payload),
        regional_source="documented" if source_url else "not_documented",
        source_url=source_url, source_version=source_version, context_name=context_name,
    )


def compare_alternatives(
    payload: AlternativeGenerationInput,
    regions: tuple[VerifiedRegion, ...] | None = None,
) -> ComparisonResult:
    """Never accept alternatives or scores from the client."""
    generated: AlternativeGenerationResult = (
        generate_alternatives(payload) if regions is None
        else generate_alternatives(payload, regions)
    )
    options = [_option("proposal", payload.proposal, payload)]
    for alternative in generated.alternatives:
        sequence = RotationProposalInput(seasons=alternative.seasons)
        options.append(_option(
            "alternative", sequence, payload,
            source_url=alternative.source_url,
            source_version=alternative.source_version,
            context_name=alternative.context_name,
        ))
    return ComparisonResult(
        status="ready" if generated.status == "generated" else "limited",
        reason=(
            "Comparação descritiva; adequação agronômica indisponível para todas as opções."
            if generated.status == "generated"
            else f"Só a proposta informada pode ser exibida. {generated.reason}"
        ),
        options=options,
        missing_for_comparison=generated.missing_for_generation,
    )
