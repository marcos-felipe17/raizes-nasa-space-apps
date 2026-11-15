from pathlib import Path

from fastapi.testclient import TestClient

from src.api.main import app
from src.domain.scenario import Scenario
from src.infrastructure.scenario_repository import ScenarioRepository

client = TestClient(app)


def test_list_scenarios_returns_at_least_two_simulated_items() -> None:
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    for item in data:
        assert item.get("simulado") is True
        assert item.get("id")
        assert "nome" in item
        assert "regiao_aproximada" in item


def test_get_existing_scenario_returns_200_and_detail() -> None:
    list_response = client.get("/api/scenarios")
    first_id = list_response.json()[0]["id"]

    response = client.get(f"/api/scenarios/{first_id}")
    assert response.status_code == 200
    detail = response.json()
    assert detail["id"] == first_id
    assert detail["simulado"] is True
    assert "solo" in detail
    assert "regime_hidrico" in detail
    assert "historico" in detail
    assert "culturas_possiveis" in detail
    assert "prioridade" in detail


def test_get_nonexistent_scenario_returns_404() -> None:
    response = client.get("/api/scenarios/cenario-inexistente-999")
    assert response.status_code == 404


def test_non_simulated_scenario_is_filtered_out(tmp_path: Path) -> None:
    fixture_file = tmp_path / "scenarios.json"
    fixture_file.write_text(
        """
        [
          {"id": "sim-1", "nome": "Simulado", "simulado": true},
          {"id": "real-1", "nome": "Não simulado", "simulado": false}
        ]
        """,
        encoding="utf-8",
    )
    repo = ScenarioRepository(fixture_path=fixture_file)
    items = repo.list_simulated()
    assert len(items) == 1
    assert items[0].id == "sim-1"
    assert Scenario.from_dict({"id": "real-1", "simulado": False}) is None
