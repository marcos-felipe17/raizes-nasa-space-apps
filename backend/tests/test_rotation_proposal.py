import unittest

from fastapi.testclient import TestClient

from raizes_api.main import app


class RotationProposalTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.seasons = [
            {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
            {"crop": "milho", "start_month": "2027-05", "end_month": "2027-08"},
        ]

    def test_two_seasons_are_preserved_without_analysis(self):
        response = self.client.post("/api/v1/areas/rotation-proposal/validate", json={"seasons": self.seasons})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["proposal"]["seasons"], self.seasons)
        self.assertFalse(response.json()["analysis_performed"])

    def test_exactly_two_seasons_required(self):
        for seasons in (self.seasons[:1], self.seasons + self.seasons[:1]):
            with self.subTest(count=len(seasons)):
                response = self.client.post("/api/v1/areas/rotation-proposal/validate", json={"seasons": seasons})
                self.assertEqual(response.status_code, 422)

    def test_second_season_must_start_later(self):
        seasons = [self.seasons[1], self.seasons[0]]
        response = self.client.post("/api/v1/areas/rotation-proposal/validate", json={"seasons": seasons})
        self.assertEqual(response.status_code, 422)

    def test_invalid_period_rejected(self):
        seasons = [{**self.seasons[0], "end_month": "2026-12"}, self.seasons[1]]
        response = self.client.post("/api/v1/areas/rotation-proposal/validate", json={"seasons": seasons})
        self.assertEqual(response.status_code, 422)

    def test_same_crop_and_overlapping_period_are_preserved_for_later_analysis(self):
        seasons = [self.seasons[0], {"crop": "soja", "start_month": "2027-03", "end_month": "2027-06"}]
        response = self.client.post("/api/v1/areas/rotation-proposal/validate", json={"seasons": seasons})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["proposal"]["seasons"], seasons)


if __name__ == "__main__":
    unittest.main()
