"""UC-14: explain only conclusions supported by checked rules."""

from typing import Literal

from pydantic import BaseModel

from .restrictions import (
    RestrictionCheckInput,
    RuleCheck,
    check_restrictions,
)


class CriterionExplanation(BaseModel):
    rule_id: str
    outcome: Literal["violated", "passed"]
    reason: str
    scope: str
    source: str
    source_urls: list[str]


class ExplanationResult(BaseModel):
    status: Literal["excluded", "inconclusive"]
    conclusion: str
    criteria: list[CriterionExplanation]
    restrictions: list[CriterionExplanation]
    uncertainties: list[str]
    missing_for_conclusion: list[str]
    next_steps: list[str]
    indicator_r: None = None


def _criterion(rule: RuleCheck) -> CriterionExplanation:
    return CriterionExplanation(
        rule_id=rule.rule_id,
        outcome=rule.outcome,
        reason=rule.reason,
        scope=rule.scope,
        source=rule.source,
        source_urls=rule.source_urls,
    )


def explain_proposal(payload: RestrictionCheckInput) -> ExplanationResult:
    """Derive every claim from UC-11; do not trust client-supplied results."""
    check = check_restrictions(payload)
    criteria = [_criterion(rule) for rule in check.checked_rules]
    restrictions = [rule for rule in criteria if rule.outcome == "violated"]
    uncertainties = [
        "A verificação cobre apenas a diversidade entre os nomes das culturas; "
        "não avalia solo, regime hídrico, calendário nem viabilidade local.",
        "A proposta é um rascunho sem vínculo persistente com uma área de cultivo.",
    ]
    if check.status == "excluded":
        uncertainties.append(
            "A exclusão vale para esta proposta como rotação diversificada; "
            "não significa que o cultivo da cultura seja proibido."
        )
        next_steps = ["Altere uma das culturas na proposta e verifique novamente."]
    else:
        uncertainties.append(
            "Ainda não há regras regionais auditadas para concluir a adequação da parcela."
        )
        next_steps = [
            "Verifique as regras regionais aplicáveis à localização, culturas e períodos.",
            "Confirme solo e manejo da mesma área antes de avaliar adequação.",
        ]
    return ExplanationResult(
        status=check.status,
        conclusion=check.reason,
        criteria=criteria,
        restrictions=restrictions,
        uncertainties=uncertainties,
        missing_for_conclusion=check.missing_for_conclusion,
        next_steps=next_steps,
    )
