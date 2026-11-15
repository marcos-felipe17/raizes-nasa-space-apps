"""FastAPI entry point for the Raízes area profile."""

from fastapi import FastAPI, HTTPException

from .candidate_crops import (
    CandidateCropsInput,
    CandidateCropsValidation,
    validate_candidate_crops,
)
from .history import (
    CultivationHistoryInput,
    CultivationHistoryValidation,
    validate_cultivation_history,
)
from .profile import AreaProfileInput, AreaProfileValidation, validate_area_profile
from .scenarios import Scenario, get_scenario, list_scenarios
from .soil import SoilInput, SoilValidation, validate_soil

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


@app.get("/api/scenarios", response_model=list[Scenario])
def list_simulated_scenarios() -> list[Scenario]:
    return list_scenarios()


@app.get("/api/scenarios/{scenario_id}", response_model=Scenario)
def get_simulated_scenario(scenario_id: str) -> Scenario:
    scenario = get_scenario(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Cenário não encontrado")
    return scenario
