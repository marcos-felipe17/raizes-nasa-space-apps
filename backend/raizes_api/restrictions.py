"""UC-11: deterministic restriction checks with explicit abstention."""

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict

from .rotation_proposal import RotationProposalInput


RULE_ID = "rotation.distinct_crops.v1"
RULE_SOURCE = (
    "Embrapa, Documentos 256 (2024); "
    "USDA NRCS, Conservation Crop Rotation 328 (2026)"
)
RULE_URLS = [
    "https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/1166202/1/Documentos256-AnaLuciaBorges-2024-AINFO-1.pdf",
    "https://www.nrcs.usda.gov/publications/nhcp-notice-179/328-cps-conservation-crop-rotation-2026.pdf",
]


class RestrictionCheckInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    proposal: RotationProposalInput


class RuleCheck(BaseModel):
    rule_id: str
    outcome: Literal["violated", "passed"]
    reason: str
    source: str
    source_urls: list[str]
    scope: str


class RestrictionCheckResult(BaseModel):
    status: Literal["excluded", "inconclusive"]
    reason: str
    checked_rules: list[RuleCheck]
    missing_for_conclusion: list[str]


def _normalized_crop(name: str) -> str:
    return re.sub(r"\s+", " ", name.strip()).casefold()


def check_restrictions(payload: RestrictionCheckInput) -> RestrictionCheckResult:
    """Exclude only an identical named crop; never infer regional suitability."""
    first, second = payload.proposal.seasons
    same_crop = _normalized_crop(first.crop) == _normalized_crop(second.crop)
    rule = RuleCheck(
        rule_id=RULE_ID,
        outcome="violated" if same_crop else "passed",
        reason=(
            "A mesma cultura foi informada nas duas safras; a sequência não diversifica culturas."
            if same_crop else "As duas safras têm nomes de culturas diferentes."
        ),
        source=RULE_SOURCE,
        source_urls=RULE_URLS,
        scope="Critério estrutural de rotação; não avalia viabilidade de plantio local.",
    )
    if same_crop:
        return RestrictionCheckResult(
            status="excluded",
            reason="Descartada como rotação de culturas. Isso não significa que o plantio seja proibido.",
            checked_rules=[rule], missing_for_conclusion=[],
        )
    return RestrictionCheckResult(
        status="inconclusive",
        reason="A proposta passou no critério estrutural, mas faltam regras locais verificadas para concluir sua adequação.",
        checked_rules=[rule], missing_for_conclusion=["regional_rules"],
    )
