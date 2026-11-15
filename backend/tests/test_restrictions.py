import unittest

from fastapi.testclient import TestClient

from raizes_api.main import app


class RestrictionCheckTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.seasons = [
            {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
            {"crop": "milho", "start_month": "2027-05", "end_month": "2027-08"},
        ]

    def check(self, seasons):
        return self.client.post("/api/v1/areas/restrictions/check", json={"proposal": {"seasons": seasons}})

    def test_repeated_crop_excluded_with_rule_and_no_score(self):
        response = self.check([self.seasons[0], {**self.seasons[1], "crop": " SOJA "}])
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["status"], "excluded")
        self.assertEqual(result["checked_rules"][0]["outcome"], "violated")
        self.assertTrue(result["checked_rules"][0]["rule_id"])
        self.assertTrue(result["checked_rules"][0]["source_urls"])
        self.assertNotIn("r", result)

    def test_distinct_crops_remain_inconclusive(self):
        response = self.check(self.seasons)
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["status"], "inconclusive")
        self.assertEqual(result["checked_rules"][0]["outcome"], "passed")
        self.assertEqual(result["missing_for_conclusion"], ["regional_rules"])
        self.assertNotIn("r", result)

    def test_invalid_proposal_rejected(self):
        response = self.check(self.seasons[:1])
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
