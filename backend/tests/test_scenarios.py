import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi.testclient import TestClient

from raizes_api.main import app
from raizes_api.scenarios import Scenario, list_scenarios


class ScenarioTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_list_contains_simulated_scenarios_with_canonical_profile(self):
        response = self.client.get("/api/scenarios")
        self.assertEqual(response.status_code, 200)
        scenarios = response.json()
        self.assertGreaterEqual(len(scenarios), 2)
        self.assertTrue(all(item["simulated"] is True for item in scenarios))
        for item in scenarios:
            Scenario.model_validate(item)

    def test_detail_and_not_found(self):
        scenario_id = self.client.get("/api/scenarios").json()[0]["id"]
        self.assertEqual(self.client.get(f"/api/scenarios/{scenario_id}").status_code, 200)
        self.assertEqual(self.client.get("/api/scenarios/missing").status_code, 404)

    def test_non_simulated_record_is_not_served(self):
        with TemporaryDirectory() as directory:
            fixture = Path(directory) / "scenarios.json"
            fixture.write_text(json.dumps([{"id": "real", "simulated": False}]), encoding="utf-8")
            self.assertEqual(list_scenarios(fixture), [])


if __name__ == "__main__":
    unittest.main()
