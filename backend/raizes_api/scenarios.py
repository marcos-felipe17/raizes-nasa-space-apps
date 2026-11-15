"""Read-only simulated scenarios for UC-01."""

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .candidate_crops import CandidateCropsInput, CandidateCropsStatus
from .history import CultivationHistoryInput
from .profile import WaterRegime
from .soil import SoilInput


FIXTURE_PATH = Path(__file__).resolve().parents[2] / "data" / "fixtures" / "scenarios.json"


class Scenario(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    approximate_region: str = Field(min_length=1)
    soil: SoilInput
    water_regime: WaterRegime
    history: CultivationHistoryInput | None
    possible_crops: list[str]
    priority: str | None
    simulated: Literal[True]

    @field_validator("possible_crops")
    @classmethod
    def validate_possible_crops(cls, value: list[str]) -> list[str]:
        """Apply the same crop-name rules to simulated options."""
        return CandidateCropsInput(
            status=CandidateCropsStatus.KNOWN, crops=value
        ).crops


def list_scenarios(fixture_path: Path = FIXTURE_PATH) -> list[Scenario]:
    """Load only explicitly simulated records and validate shared profile contracts."""
    with fixture_path.open(encoding="utf-8") as file:
        raw = json.load(file)
    if not isinstance(raw, list):
        raise ValueError("Scenario fixture must be a list")
    return [Scenario.model_validate(item) for item in raw if isinstance(item, dict) and item.get("simulated") is True]


def get_scenario(scenario_id: str, fixture_path: Path = FIXTURE_PATH) -> Scenario | None:
    return next((scenario for scenario in list_scenarios(fixture_path) if scenario.id == scenario_id), None)
