"""UC-08: auditable coverage for a point and the farmer's local inputs."""

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from pydantic import BaseModel, ConfigDict, Field


SOURCE_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
MISSING = -999


class CoverageInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    soil_known: bool = False
    water_regime_known: bool = False
    history_known: bool = False
    candidate_crops_known: bool = False


class CoverageItem(BaseModel):
    key: str
    label: str
    status: str
    source: str
    detail: str


class CoverageResult(BaseModel):
    latitude: float
    longitude: float
    items: list[CoverageItem]
    recommendation_ready: bool = False


def _has_data(parameter: object) -> bool:
    if not isinstance(parameter, dict):
        return False
    return any(isinstance(value, (int, float)) and value != MISSING for value in parameter.values())


def check_coverage(payload: CoverageInput) -> CoverageResult:
    items = []
    local_fields = (
        ("soil", "Solo", payload.soil_known),
        ("water_regime", "Regime hídrico", payload.water_regime_known),
        ("history", "Histórico de cultivo", payload.history_known),
        ("candidate_crops", "Culturas candidatas", payload.candidate_crops_known),
    )
    for key, label, known in local_fields:
        items.append(CoverageItem(
            key=key, label=label, status="available" if known else "missing",
            source="Informado pelo agricultor",
            detail="Registrado neste navegador." if known else "Ainda não informado para esta área.",
        ))

    query = urlencode({
        "parameters": "T2M,PRECTOTCORR", "community": "AG",
        "longitude": payload.longitude, "latitude": payload.latitude, "format": "JSON",
    })
    parameters = None
    try:
        request = Request(f"{SOURCE_URL}?{query}", headers={"User-Agent": "RaizesSpaceApps/0.1"})
        with urlopen(request, timeout=8) as response:
            data = json.load(response)
        parameters = data.get("properties", {}).get("parameter", {})
        if not isinstance(parameters, dict):
            parameters = None
    except (HTTPError, URLError, TimeoutError, ValueError, OSError):
        pass

    for key, label, parameter in (
        ("temperature", "Temperatura do ar", "T2M"),
        ("precipitation", "Precipitação", "PRECTOTCORR"),
    ):
        status = "unverified" if parameters is None else (
            "available" if _has_data(parameters.get(parameter)) else "missing"
        )
        detail = {
            "available": "Climatologia retornada para o ponto informado; não representa medição da parcela.",
            "missing": "A consulta respondeu sem valores válidos para este parâmetro.",
            "unverified": "Não foi possível confirmar a cobertura agora. Tente novamente.",
        }[status]
        items.append(CoverageItem(key=key, label=label, status=status,
                                  source="NASA POWER · climatologia", detail=detail))

    return CoverageResult(latitude=payload.latitude, longitude=payload.longitude, items=items)
