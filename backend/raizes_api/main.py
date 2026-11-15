"""FastAPI entry point for UC-03."""

from fastapi import FastAPI

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
