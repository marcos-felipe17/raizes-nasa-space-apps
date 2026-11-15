"""UC-12: identificação determinística de lacunas de dados para análise de rotação."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from .candidate_crops import CandidateCropsStatus, CandidateCropsValidation
from .coverage import CoverageResult
from .history import CultivationHistoryValidation, CultivationPeriod
from .profile import AreaProfileValidation, WaterRegime
from .rotation_proposal import RotationProposalValidation
from .soil import SoilStatus, SoilValidation

FIXTURE_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "fixtures"
    / "rule_requirements_placeholder.json"
)

ExpectedSource = Literal[
    "farmer_input",
    "nasa_earth_observation",
    "regional_agricultural_rule",
]

EvaluationStatus = Literal["inconclusive", "no_gaps_identified"]
RegionalCoverageStatus = Literal["no_coverage", "covered"]

UNVERIFIED_COVERAGE_GUIDANCE = "Consulte a cobertura em /cobertura."
REGIONAL_RULES_NOTICE = "Regras regionais ainda não auditadas (ADR-0003)"


class GapItem(BaseModel):
    code: str
    missing_data: str
    dependent_rule: str
    expected_source: ExpectedSource
    reason: str
    source: str = "PLACEHOLDER"


class UnverifiedItem(BaseModel):
    code: str
    label: str
    status: Literal["unverified"] = "unverified"
    dependent_rule: str
    expected_source: ExpectedSource
    detail: str


class CropRuleCoverage(BaseModel):
    crop: str
    status: RegionalCoverageStatus = "no_coverage"
    expected_source: ExpectedSource = "regional_agricultural_rule"
    source: str = "PLACEHOLDER"
    placeholder: Literal[True] = True
    notice: str = REGIONAL_RULES_NOTICE
    detail: str


class EvaluationGapSummary(BaseModel):
    rule_id: str
    rule_name: str
    required_code: str
    status: EvaluationStatus
    gaps: list[GapItem] = Field(default_factory=list)
    unverified: list[UnverifiedItem] = Field(default_factory=list)
    source: str = "PLACEHOLDER"
    # PROPOSTA (critério oficial UC-12: "Opção inconclusiva não recebe R.")
    r_score: None = None
    r_absence_reason: str


class GapsInput(BaseModel):
    """Aceita as partes já validadas (ou ausentes) numa única requisição."""

    model_config = ConfigDict(extra="ignore")

    soil: SoilValidation | dict[str, Any] | None = None
    profile: AreaProfileValidation | dict[str, Any] | None = None
    history: CultivationHistoryValidation | dict[str, Any] | None = None
    candidate_crops: CandidateCropsValidation | dict[str, Any] | None = None
    coverage: CoverageResult | dict[str, Any] | None = None
    rotation_proposal: RotationProposalValidation | dict[str, Any] | None = None
    # Permite avaliar sequências de comprimento arbitrário (ADR-0002), além das 2 safras da UC-10.
    seasons: list[CultivationPeriod | dict[str, Any]] | None = None


class GapsResult(BaseModel):
    status: EvaluationStatus
    gaps: list[GapItem]
    unverified_items: list[UnverifiedItem]
    evaluations: list[EvaluationGapSummary]
    regional_rules_coverage: list[CropRuleCoverage]
    regional_rules_notice: str = REGIONAL_RULES_NOTICE
    # PROPOSTA (critério oficial UC-12: "Opção inconclusiva não recebe R.")
    r_score: None = None
    r_absence_reason: str
    eligibility_evaluated: Literal[False] = False
    recommendation_ready: Literal[False] = False
    simulated_requirements: Literal[True] = True
    requirements_source: str = "PLACEHOLDER"


def load_requirements_fixture(path: Path = FIXTURE_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _extract_dict(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    if isinstance(value, BaseModel):
        return value.model_dump()
    if isinstance(value, dict):
        return value
    return None


def _is_soil_known(soil_part: dict[str, Any] | None, profile_part: dict[str, Any] | None) -> bool:
    for container in (profile_part, soil_part):
        if not container:
            continue
        inner = container.get("profile") if "profile" in container else container
        if not isinstance(inner, dict):
            continue
        soil = inner.get("soil") if "soil" in inner else inner
        if isinstance(soil, dict) and soil.get("status") == SoilStatus.KNOWN:
            if soil.get("description") or soil.get("classification"):
                return True
    return False


def _is_water_regime_known(profile_part: dict[str, Any] | None) -> bool:
    if not profile_part:
        return False
    inner = profile_part.get("profile") if "profile" in profile_part else profile_part
    if not isinstance(inner, dict):
        return False
    regime = inner.get("water_regime")
    return regime in (WaterRegime.RAINFED, WaterRegime.IRRIGATED)


def _is_history_known(history_part: dict[str, Any] | None) -> bool:
    if not history_part:
        return False
    inner = history_part.get("history") if "history" in history_part else history_part
    if not isinstance(inner, dict):
        return False
    periods = inner.get("periods")
    if not isinstance(periods, list) or len(periods) == 0:
        return False
    return all(
        isinstance(item, dict)
        and isinstance(item.get("crop"), str)
        and bool(item.get("crop", "").strip())
        and isinstance(item.get("start_month"), str)
        and isinstance(item.get("end_month"), str)
        for item in periods
    )


def _is_candidate_crops_known(crops_part: dict[str, Any] | None) -> bool:
    if not crops_part:
        return False
    inner = crops_part.get("candidate_crops") if "candidate_crops" in crops_part else crops_part
    if not isinstance(inner, dict):
        return False
    if inner.get("status") != CandidateCropsStatus.KNOWN:
        return False
    crops = inner.get("crops")
    return isinstance(crops, list) and any(
        isinstance(c, str) and bool(c.strip()) for c in crops
    )


def _extract_seasons(
    proposal_part: dict[str, Any] | None,
    seasons_part: list[Any] | None,
) -> list[dict[str, str]]:
    raw_seasons: list[Any] = []
    if isinstance(seasons_part, list) and seasons_part:
        raw_seasons = seasons_part
    elif proposal_part:
        inner = proposal_part.get("proposal") if "proposal" in proposal_part else proposal_part
        if isinstance(inner, dict) and isinstance(inner.get("seasons"), list):
            raw_seasons = inner["seasons"]

    valid: list[dict[str, str]] = []
    for item in raw_seasons:
        data = item.model_dump() if isinstance(item, BaseModel) else item
        if not isinstance(data, dict):
            return []
        crop = str(data.get("crop") or "").strip()
        start_month = str(data.get("start_month") or "").strip()
        end_month = str(data.get("end_month") or "").strip()
        if not crop or not start_month or not end_month or end_month < start_month:
            return []
        valid.append({"crop": crop, "start_month": start_month, "end_month": end_month})
    return valid


def _coverage_item_map(coverage_part: dict[str, Any] | None) -> dict[str, dict[str, str]]:
    if not coverage_part:
        return {}
    items = coverage_part.get("items")
    if not isinstance(items, list):
        return {}
    mapped: dict[str, dict[str, str]] = {}
    for item in items:
        data = item.model_dump() if isinstance(item, BaseModel) else item
        if isinstance(data, dict) and isinstance(data.get("key"), str):
            mapped[data["key"]] = {
                "key": str(data.get("key", "")),
                "label": str(data.get("label", data.get("key", ""))),
                "status": str(data.get("status", "unverified")),
                "source": str(data.get("source", "")),
                "detail": str(data.get("detail", "")),
            }
    return mapped


def identify_gaps(
    payload: GapsInput | dict[str, Any] | None = None,
    fixture: dict[str, Any] | None = None,
) -> GapsResult:
    """Função pura e determinística para identificar lacunas de dados (UC-12)."""
    parsed = (
        payload
        if isinstance(payload, GapsInput)
        else GapsInput.model_validate(payload or {})
    )
    rules_doc = fixture if fixture is not None else load_requirements_fixture()

    soil_dict = _extract_dict(parsed.soil)
    profile_dict = _extract_dict(parsed.profile)
    history_dict = _extract_dict(parsed.history)
    crops_dict = _extract_dict(parsed.candidate_crops)
    coverage_dict = _extract_dict(parsed.coverage)
    proposal_dict = _extract_dict(parsed.rotation_proposal)

    coverage_map = _coverage_item_map(coverage_dict)

    soil_known = _is_soil_known(soil_dict, profile_dict)
    water_known = _is_water_regime_known(profile_dict)
    history_known = _is_history_known(history_dict)
    candidate_crops_known = _is_candidate_crops_known(crops_dict)
    seasons = _extract_seasons(proposal_dict, parsed.seasons)
    proposal_known = len(seasons) >= 1

    local_known_by_code: dict[str, bool] = {
        "soil": soil_known,
        "water_regime": water_known,
        "history": history_known,
        "candidate_crops": candidate_crops_known,
        "rotation_proposal": proposal_known,
    }

    gaps: list[GapItem] = []
    unverified_items: list[UnverifiedItem] = []
    evaluations: list[EvaluationGapSummary] = []

    for eval_spec in rules_doc.get("evaluations", []):
        code = str(eval_spec["required_code"])
        rule_id = str(eval_spec["rule_id"])
        rule_name = str(eval_spec["rule_name"])
        missing_data = str(eval_spec["missing_data"])
        expected_source: ExpectedSource = eval_spec["expected_source"]
        reason = str(eval_spec["reason"])
        source_tag = str(eval_spec.get("source", "PLACEHOLDER"))

        eval_gaps: list[GapItem] = []
        eval_unverified: list[UnverifiedItem] = []

        if code in ("temperature", "precipitation"):
            cov_item = coverage_map.get(code)
            cov_status = cov_item["status"] if cov_item else "unverified"
            label = (
                cov_item["label"]
                if cov_item and cov_item.get("label")
                else ("Temperatura do ar" if code == "temperature" else "Precipitação")
            )
            if cov_status == "missing":
                gap = GapItem(
                    code=code,
                    missing_data=missing_data,
                    dependent_rule=rule_name,
                    expected_source=expected_source,
                    reason=reason,
                    source=source_tag,
                )
                gaps.append(gap)
                eval_gaps.append(gap)
            elif cov_status != "available":
                detail = (
                    f"{cov_item['detail']} {UNVERIFIED_COVERAGE_GUIDANCE}".strip()
                    if cov_item and cov_item.get("detail")
                    else f"Cobertura climática ainda não verificada para este ponto. {UNVERIFIED_COVERAGE_GUIDANCE}"
                )
                unv = UnverifiedItem(
                    code=code,
                    label=label,
                    status="unverified",
                    dependent_rule=rule_name,
                    expected_source=expected_source,
                    detail=detail,
                )
                unverified_items.append(unv)
                eval_unverified.append(unv)
        else:
            is_known = local_known_by_code.get(code, False)
            if not is_known:
                gap = GapItem(
                    code=code,
                    missing_data=missing_data,
                    dependent_rule=rule_name,
                    expected_source=expected_source,
                    reason=reason,
                    source=source_tag,
                )
                gaps.append(gap)
                eval_gaps.append(gap)

        is_inconclusive = bool(eval_gaps or eval_unverified)
        eval_status: EvaluationStatus = (
            "inconclusive" if is_inconclusive else "no_gaps_identified"
        )
        r_reason = (
            "Avaliação inconclusiva: opção inconclusiva não recebe R."
            if is_inconclusive
            else "R não é calculado na identificação de lacunas (UC-12)."
        )
        evaluations.append(
            EvaluationGapSummary(
                rule_id=rule_id,
                rule_name=rule_name,
                required_code=code,
                status=eval_status,
                gaps=eval_gaps,
                unverified=eval_unverified,
                source=source_tag,
                r_score=None,
                r_absence_reason=r_reason,
            )
        )

    covered_crops = {
        str(c).strip().casefold() for c in rules_doc.get("covered_crops", []) if str(c).strip()
    }
    regional_notice = str(
        rules_doc.get("regional_rules_placeholder", {}).get(
            "notice", REGIONAL_RULES_NOTICE
        )
    )
    regional_coverage: list[CropRuleCoverage] = []
    seen_crops: set[str] = set()
    for season in seasons:
        crop_name = season["crop"]
        norm = crop_name.casefold()
        if norm in seen_crops:
            continue
        seen_crops.add(norm)
        is_covered = norm in covered_crops
        regional_coverage.append(
            CropRuleCoverage(
                crop=crop_name,
                status="covered" if is_covered else "no_coverage",
                expected_source="regional_agricultural_rule",
                source="PLACEHOLDER",
                placeholder=True,
                notice=regional_notice,
                detail=(
                    f"Sem cobertura de regra agrícola regional para '{crop_name}' [PLACEHOLDER]. "
                    f"{regional_notice}. Ausência de regra significa sem cobertura, não cultura proibida."
                ),
            )
        )

    overall_inconclusive = bool(gaps or unverified_items)
    overall_status: EvaluationStatus = (
        "inconclusive" if overall_inconclusive else "no_gaps_identified"
    )
    overall_r_reason = (
        "Opção inconclusiva não recebe R."
        if overall_inconclusive
        else "R não é calculado nesta etapa (UC-12 identifica apenas lacunas de dados)."
    )

    return GapsResult(
        status=overall_status,
        gaps=gaps,
        unverified_items=unverified_items,
        evaluations=evaluations,
        regional_rules_coverage=regional_coverage,
        regional_rules_notice=regional_notice,
        r_score=None,
        r_absence_reason=overall_r_reason,
        eligibility_evaluated=False,
        recommendation_ready=False,
        simulated_requirements=True,
        requirements_source="PLACEHOLDER",
    )
