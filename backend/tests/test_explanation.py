import unittest

from fastapi.testclient import TestClient

from raizes_api.main import app


class ExplanationTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.proposal = {"seasons": [
            {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
            {"crop": "milho", "start_month": "2027-05", "end_month": "2027-08"},
        ]}

    def test_distinct_crops_explain_passed_criterion_and_uncertainty(self):
        response = self.client.post(
            "/api/v1/areas/rotation-proposal/explain", json={"proposal": self.proposal},
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["status"], "inconclusive")
        self.assertEqual(result["criteria"][0]["outcome"], "passed")
        self.assertEqual(result["restrictions"], [])
        self.assertIn("regional_rules", result["missing_for_conclusion"])
        self.assertIsNone(result["indicator_r"])
        self.assertTrue(result["criteria"][0]["source_urls"])
        self.assertTrue(result["uncertainties"])

    def test_repeated_crop_explains_violation_without_claiming_prohibition(self):
        proposal = {"seasons": [self.proposal["seasons"][0], {
            "crop": " SOJA ", "start_month": "2027-05", "end_month": "2027-08",
        }]}
        response = self.client.post(
            "/api/v1/areas/rotation-proposal/explain", json={"proposal": proposal},
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["status"], "excluded")
        self.assertEqual(result["criteria"][0]["outcome"], "violated")
        self.assertEqual(result["restrictions"], result["criteria"])
        self.assertTrue(any("não significa" in item for item in result["uncertainties"]))
        self.assertIsNone(result["indicator_r"])

    def test_client_cannot_supply_fake_results_or_score(self):
        for field, value in (("indicator_r", 0.99), ("status", "eligible")):
            with self.subTest(field=field):
                response = self.client.post(
                    "/api/v1/areas/rotation-proposal/explain",
                    json={"proposal": self.proposal, field: value},
                )
                self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
