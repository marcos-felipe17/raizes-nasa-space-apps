import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.application.list_scenarios import ScenarioUseCases


def _get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]


app = FastAPI(
    title="Raízes API",
    description="API de cenários simulados do protótipo Raízes (US-01).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

use_cases = ScenarioUseCases()


@app.get("/api/scenarios")
def list_scenarios() -> list[dict[str, Any]]:
    return use_cases.list_scenarios()


@app.get("/api/scenarios/{scenario_id}")
def get_scenario(scenario_id: str) -> dict[str, Any]:
    scenario = use_cases.get_scenario_detail(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Cenário não encontrado")
    return scenario
