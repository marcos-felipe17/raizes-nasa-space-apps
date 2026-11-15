import json
from pathlib import Path
from typing import Optional

from src.domain.scenario import Scenario

DEFAULT_FIXTURE_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "fixtures" / "scenarios.json"
)


class ScenarioRepository:
    def __init__(self, fixture_path: Optional[Path] = None) -> None:
        self._fixture_path = fixture_path or DEFAULT_FIXTURE_PATH

    def list_simulated(self) -> list[Scenario]:
        if not self._fixture_path.exists():
            return []

        with self._fixture_path.open("r", encoding="utf-8") as file:
            raw_items = json.load(file)

        if not isinstance(raw_items, list):
            return []

        scenarios: list[Scenario] = []
        for raw in raw_items:
            if isinstance(raw, dict):
                scenario = Scenario.from_dict(raw)
                if scenario is not None and scenario.simulado is True:
                    scenarios.append(scenario)
        return scenarios

    def get_by_id(self, scenario_id: str) -> Optional[Scenario]:
        for scenario in self.list_simulated():
            if scenario.id == scenario_id:
                return scenario
        return None
