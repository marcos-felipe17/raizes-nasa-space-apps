"""UC-18: consultar relatos comparáveis mostrando semelhanças, diferenças e exclusões."""

from collections.abc import Sequence
from math import asin, cos, radians, sin, sqrt
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .profile import WaterRegime
from .rotation_proposal import RotationProposalInput
from .soil import SoilInput, SoilStatus

OriginKind = Literal["real_community", "experimental", "synthetic_demo"]

_REGIME_LABEL: dict[WaterRegime, str] = {
    WaterRegime.RAINFED: "sequeiro",
    WaterRegime.IRRIGATED: "irrigado",
}


class CommunityReport(BaseModel):
    """Registro de experiência comunitária, experimental ou de demonstração."""

    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=2)
    title: str = Field(min_length=3)
    origin_kind: OriginKind
    origin_label: str = Field(min_length=3)
    place: str = Field(min_length=2)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    water_regime: WaterRegime
    soil_classification: str | None = None
    crops: list[str] = Field(min_length=1)
    summary: str = Field(min_length=10)
    source_note: str = Field(min_length=3)


class ReportQueryInput(BaseModel):
    """Contexto da área e proposta para buscar relatos comparáveis."""

    model_config = ConfigDict(extra="forbid")

    place: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    water_regime: WaterRegime
    soil: SoilInput = Field(default_factory=lambda: SoilInput(status=SoilStatus.UNKNOWN))
    proposal: RotationProposalInput | None = None


class MatchedReport(BaseModel):
    """Relato classificado com semelhanças, diferenças e eventuais exclusões."""

    report: CommunityReport
    distance_km: float | None = None
    similarities: list[str]
    differences: list[str]
    excluded: bool
    exclusion_reasons: list[str]


class ReportConsultationResult(BaseModel):
    """Resposta da UC-18 mantendo Q indisponível sem relatos comunitários reais."""

    q_indicator: Literal["unavailable"] = "unavailable"
    q_reason: str
    comparable_reports: list[MatchedReport]
    excluded_reports: list[MatchedReport]
    total_catalog: int


DEFAULT_REPORTS: tuple[CommunityReport, ...] = (
    CommunityReport(
        id="demo-sinop-soja-milho",
        title="Sucessão Soja → Milho em área de sequeiro no Norte de MT",
        origin_kind="synthetic_demo",
        origin_label="Simulação para demonstração (não conta em Q)",
        place="Sinop, MT",
        latitude=-11.8609,
        longitude=-55.5053,
        water_regime=WaterRegime.RAINFED,
        soil_classification="Textura argilosa",
        crops=["Soja", "Milho"],
        summary="Plantio de soja na 1ª safra seguido de milho safrinha em janela chuvosa regular.",
        source_note="Catálogo de demonstração PoC v0.1 (fictício)",
    ),
    CommunityReport(
        id="demo-sorriso-soja-milheto",
        title="Cobertura com Milheto após Soja em solo médio",
        origin_kind="synthetic_demo",
        origin_label="Simulação para demonstração (não conta em Q)",
        place="Sorriso, MT",
        latitude=-12.5425,
        longitude=-55.7211,
        water_regime=WaterRegime.RAINFED,
        soil_classification="Textura média",
        crops=["Soja", "Milheto"],
        summary="Uso de milheto na segunda janela para proteção de solo em ano com veranico moderado.",
        source_note="Catálogo de demonstração PoC v0.1 (fictício)",
    ),
    CommunityReport(
        id="demo-rioverde-milho-sorgo",
        title="Alternância Milho → Sorgo para tolerância a déficit hídrico",
        origin_kind="synthetic_demo",
        origin_label="Simulação para demonstração (não conta em Q)",
        place="Rio Verde, GO",
        latitude=-17.7923,
        longitude=-50.9192,
        water_regime=WaterRegime.RAINFED,
        soil_classification="Textura argilosa",
        crops=["Milho", "Sorgo"],
        summary="Adoção de sorgo na segunda safra após milho devido ao encurtamento das chuvas.",
        source_note="Catálogo de demonstração PoC v0.1 (fictício)",
    ),
    CommunityReport(
        id="demo-petrolina-feijao-milho-irrigado",
        title="Feijão → Milho sob irrigação localizada no Semiárido",
        origin_kind="synthetic_demo",
        origin_label="Simulação para demonstração (não conta em Q)",
        place="Petrolina, PE",
        latitude=-9.3891,
        longitude=-40.5030,
        water_regime=WaterRegime.IRRIGATED,
        soil_classification="Textura arenosa",
        crops=["Feijão", "Milho"],
        summary="Rotação intensiva com controle de lâmina de irrigação em solo arenoso.",
        source_note="Catálogo de demonstração PoC v0.1 (fictício)",
    ),
    CommunityReport(
        id="demo-boone-milho-soja",
        title="Rotação Milho → Soja no Cinturão do Milho (EUA)",
        origin_kind="synthetic_demo",
        origin_label="Simulação para demonstração (não conta em Q)",
        place="Boone, IA",
        latitude=42.0597,
        longitude=-93.8802,
        water_regime=WaterRegime.RAINFED,
        soil_classification="Textura média",
        crops=["Milho", "Soja"],
        summary="Alternância anual entre milho e soja em clima temperado com inverno rigoroso.",
        source_note="Catálogo de demonstração PoC v0.1 (fictício)",
    ),
)


def _norm(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip()).casefold()


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_km = 6371.0
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    )
    return round(2 * earth_radius_km * asin(sqrt(a)), 1)


def _evaluate_report(report: CommunityReport, query: ReportQueryInput) -> MatchedReport:
    similarities: list[str] = []
    differences: list[str] = []
    exclusion_reasons: list[str] = []

    if report.water_regime == query.water_regime:
        similarities.append(f"Mesmo regime hídrico ({_REGIME_LABEL[query.water_regime]}).")
    else:
        msg = (
            f"Regime hídrico incompatível: relato em área {_REGIME_LABEL[report.water_regime]}, "
            f"sua área é {_REGIME_LABEL[query.water_regime]}."
        )
        exclusion_reasons.append(msg)
        differences.append(msg)

    proposal_crops = (
        [season.crop for season in query.proposal.seasons] if query.proposal else []
    )
    if proposal_crops:
        proposal_keys = {_norm(crop): crop for crop in proposal_crops}
        report_keys = {_norm(crop): crop for crop in report.crops}
        shared = [
            report_keys[key] for key in report_keys if key in proposal_keys
        ]
        only_report = [
            report_keys[key] for key in report_keys if key not in proposal_keys
        ]
        if shared:
            similarities.append(f"Cultura(s) em comum: {', '.join(shared)}.")
        else:
            exclusion_reasons.append("Nenhuma cultura em comum com a rotação informada.")
        if only_report:
            differences.append(f"Outras culturas no relato: {', '.join(only_report)}.")

    user_soil = query.soil.classification or query.soil.description
    if query.soil.status == SoilStatus.KNOWN and user_soil and report.soil_classification:
        if _norm(user_soil) == _norm(report.soil_classification):
            similarities.append(f"Mesmo tipo de solo ({report.soil_classification}).")
        else:
            differences.append(
                f"Solo diferente: sua área ({user_soil}) vs. relato ({report.soil_classification})."
            )
    elif report.soil_classification:
        differences.append(
            f"Solo da sua área não especificado; relato em {report.soil_classification}."
        )

    distance_km: float | None = None
    if query.latitude is not None and query.longitude is not None:
        distance_km = _haversine_km(
            query.latitude, query.longitude, report.latitude, report.longitude
        )
        if distance_km <= 300:
            similarities.append(f"Região próxima (~{distance_km:.0f} km, em {report.place}).")
        else:
            differences.append(f"Localização distante (~{distance_km:.0f} km, em {report.place}).")

    return MatchedReport(
        report=report,
        distance_km=distance_km,
        similarities=similarities,
        differences=differences,
        excluded=bool(exclusion_reasons),
        exclusion_reasons=exclusion_reasons,
    )


def consult_reports(
    payload: ReportQueryInput,
    catalog: Sequence[CommunityReport] = DEFAULT_REPORTS,
) -> ReportConsultationResult:
    """Compare area context against stored reports, surfacing similarities, differences and exclusions."""
    evaluated = [_evaluate_report(report, payload) for report in catalog]
    comparable = [item for item in evaluated if not item.excluded]
    excluded = [item for item in evaluated if item.excluded]

    comparable.sort(
        key=lambda item: (
            -len(item.similarities),
            item.distance_km if item.distance_km is not None else float("inf"),
        )
    )

    real_count = sum(
        1 for item in comparable if item.report.origin_kind == "real_community"
    )
    q_reason = (
        "Q indisponível: os relatos exibidos são simulações de demonstração e não contam como evidência comunitária real."
        if real_count == 0
        else "Q indisponível: ainda não há relatos comunitários reais suficientes para cálculo."
    )

    return ReportConsultationResult(
        q_indicator="unavailable",
        q_reason=q_reason,
        comparable_reports=comparable,
        excluded_reports=excluded,
        total_catalog=len(catalog),
    )
