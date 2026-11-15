from typing import Any, Optional

from src.infrastructure.scenario_repository import ScenarioRepository


class ScenarioUseCases:
    def __init__(self, repository: Optional[ScenarioRepository] = None) -> None:
        self._repository = repository or ScenarioRepository()

    def list_scenarios(self) -> list[dict[str, Any]]:
        scenarios = self._repository.list_simulated()
        return [scenario.to_dict() for scenario in scenarios]

    def get_scenario_detail(self, scenario_id: str) -> Optional[dict[str, Any]]:
        scenario = self._repository.get_by_id(scenario_id)
        if scenario is None:
            return None
        return scenario.to_dict()
