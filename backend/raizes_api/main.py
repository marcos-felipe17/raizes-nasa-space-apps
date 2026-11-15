"""FastAPI entry point for the Raízes area profile."""

from fastapi import FastAPI, HTTPException

from .coverage import CoverageInput, CoverageResult, check_coverage
from .candidate_crops import (
    CandidateCropsInput,
    CandidateCropsValidation,
    validate_candidate_crops,
)
from .location import (
    LocationInput,
    LocationNotFound,
    LocationResult,
    UpstreamError,
    resolve_location,
)
from .history import (
    CultivationHistoryInput,
    CultivationHistoryValidation,
    validate_cultivation_history,
)
from .profile import AreaProfileInput, AreaProfileValidation, validate_area_profile
from .soil import SoilInput, SoilValidation, validate_soil

from .adequacy import AdequacaoInput, AdequacaoResult, avaliar_adequacao

app = FastAPI(title="Raízes API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/api/v1/areas/soil/validate",
    response_model=SoilValidation,
)
def validate_area_soil(payload: SoilInput) -> SoilValidation:
    """Validate soil for UC-03 without persisting or recommending a crop."""
    return validate_soil(payload)


@app.post(
    "/api/v1/areas/profile/validate",
    response_model=AreaProfileValidation,
)
def validate_profile(payload: AreaProfileInput) -> AreaProfileValidation:
    """Validate the field profile with an explicit water regime for UC-04."""
    return validate_area_profile(payload)


@app.post(
    "/api/v1/areas/history/validate",
    response_model=CultivationHistoryValidation,
)
def validate_history(payload: CultivationHistoryInput) -> CultivationHistoryValidation:
    """Validate the ordered cultivation history for UC-05."""
    return validate_cultivation_history(payload)


@app.post(
    "/api/v1/areas/candidate-crops/validate",
    response_model=CandidateCropsValidation,
)
def validate_area_candidate_crops(payload: CandidateCropsInput) -> CandidateCropsValidation:
    """Validate farmer-provided options without asserting crop eligibility."""
    return validate_candidate_crops(payload)


@app.post(
    "/api/v1/areas/location/resolve",
    response_model=LocationResult,
)
def resolve_area_location(payload: LocationInput) -> LocationResult:
    """Resolve o local informado e devolve contexto climático da NASA POWER (UC-02)."""
    try:
        return resolve_location(payload)
    except LocationNotFound as exc:
        raise HTTPException(
            status_code=404,
            detail="Local não encontrado. Inclua o município e a UF, por exemplo: Petrolina, PE.",
        ) from exc
    except UpstreamError as exc:
        raise HTTPException(
            status_code=503,
            detail="Serviço de localização indisponível agora. Tente novamente.",
        ) from exc


@app.post('/api/v1/areas/coverage', response_model=CoverageResult)
def get_area_coverage(payload: CoverageInput) -> CoverageResult:
    return check_coverage(payload)


@app.post('/api/v1/areas/adequacao', response_model=AdequacaoResult)
def get_area_adequacao(payload: AdequacaoInput) -> AdequacaoResult:
    return avaliar_adequacao(payload)
