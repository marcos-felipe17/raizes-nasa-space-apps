"""UC-17: record a changed priority and abstain from unsupported ranking."""

from typing import Literal

from pydantic import BaseModel, ConfigDict

from .alternatives import AlternativeGenerationInput, VerifiedRegion
from .comparison import ComparisonResult, compare_alternatives


Priority = Literal["soil_health", "water_conservation", "climate_resilience", "income"]

PRIORITY_NAMES = {
    "soil_health": "saúde do solo",
    "water_conservation": "conservação de água",
    "climate_resilience": "resiliência climática",
    "income": "renda",
}


class PrioritizationInput(AlternativeGenerationInput):
    model_config = ConfigDict(extra="forbid")
    priority: Priority


class PrioritizationResult(BaseModel):
    priority: Priority
    ranking_status: Literal["unavailable"] = "unavailable"
    order_changed: None = None
    criteria_used_for_ranking: list[str]
    missing_for_ranking: list[str]
    explanation: str
    comparison: ComparisonResult


def prioritize_alternatives(
    payload: PrioritizationInput,
    regions: tuple[VerifiedRegion, ...] | None = None,
) -> PrioritizationResult:
    """Recompute the comparison; never imply that table order is a ranking."""
    comparison = compare_alternatives(payload, regions)
    missing = ["audited_priority_indicators"]
    if comparison.status == "limited":
        missing.extend(comparison.missing_for_comparison)
    if payload.priority == "income":
        missing.append("local_prices_and_costs")
    reason = (
        f"Prioridade alterada para {PRIORITY_NAMES[payload.priority]}. "
        "Nenhum critério mudou a ordem: ainda não há indicadores agronômicos "
        "auditados e comparáveis para classificar as opções. "
        "A ordem exibida é apenas a proposta seguida das alternativas, sem ranking."
    )
    if payload.priority == "income":
        reason += " Renda também exige preços e custos locais, ainda indisponíveis."
    return PrioritizationResult(
        priority=payload.priority,
        criteria_used_for_ranking=[],
        missing_for_ranking=missing,
        explanation=reason,
        comparison=comparison,
    )
