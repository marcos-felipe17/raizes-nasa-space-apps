import unittest

from fastapi.testclient import TestClient

from raizes_api.alternatives import RegionBounds, VerifiedRegion
from raizes_api.main import app
from raizes_api.prioritization import PrioritizationInput, prioritize_alternatives


PROPOSAL = {"seasons": [
    {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
    {"crop": "milho", "start_month": "2027-05", "end_month": "2027-08"},
]}
OTHER = {"seasons": [
    {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
    {"crop": "milheto", "start_month": "2027-05", "end_month": "2027-08"},
]}


class PrioritizationTest(unittest.TestCase):
    def setUp(self):
        self.base = {
            "latitude": -11.5, "longitude": -55.5, "proposal": PROPOSAL,
            "candidate_crops": {"status": "known", "crops": ["soja", "milho", "milheto"]},
        }

    def test_api_records_priority_but_does_not_rank(self):
        response = TestClient(app).post(
            "/api/v1/areas/alternatives/prioritize",
            json={**self.base, "priority": "water_conservation"},
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["priority"], "water_conservation")
        self.assertEqual(result["ranking_status"], "unavailable")
        self.assertIsNone(result["order_changed"])
        self.assertEqual(result["criteria_used_for_ranking"], [])
        self.assertEqual(len(result["comparison"]["options"]), 1)
        self.assertIn("Nenhum critério mudou a ordem", result["explanation"])

    def test_changed_priority_keeps_unranked_options_in_input_order(self):
        region = VerifiedRegion(
            id="test-only", name="Região sintética de teste",
            bounds=RegionBounds(south=-12, north=-11, west=-56, east=-55),
            source_url="https://example.org/test-only", source_version="test-v1",
            sequences=[PROPOSAL, OTHER],
        )
        for priority in ("soil_health", "water_conservation", "climate_resilience"):
            with self.subTest(priority=priority):
                payload = PrioritizationInput.model_validate({**self.base, "priority": priority})
                result = prioritize_alternatives(payload, (region,))
                self.assertEqual(result.comparison.status, "ready")
                self.assertEqual([o.kind for o in result.comparison.options], ["proposal", "alternative"])
                self.assertEqual(result.criteria_used_for_ranking, [])
                self.assertIsNone(result.order_changed)

    def test_income_explains_missing_economic_data(self):
        payload = PrioritizationInput.model_validate({**self.base, "priority": "income"})
        result = prioritize_alternatives(payload)
        self.assertIn("local_prices_and_costs", result.missing_for_ranking)
        self.assertIn("preços e custos locais", result.explanation)

    def test_rejects_unknown_priority_and_client_supplied_scores(self):
        for extra in ({"priority": "yield"}, {"priority": "soil_health", "scores": [100]}):
            with self.subTest(extra=extra):
                response = TestClient(app).post(
                    "/api/v1/areas/alternatives/prioritize", json={**self.base, **extra},
                )
                self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
