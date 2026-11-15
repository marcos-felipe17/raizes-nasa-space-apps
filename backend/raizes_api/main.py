"""FastAPI entry point for UC-03."""

from fastapi import FastAPI

from .profile import AreaProfileInput, AreaProfileValidation, validate_area_profile
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
