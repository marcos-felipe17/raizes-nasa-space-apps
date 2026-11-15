import json
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from raizes_api.main import app


class FakeResponse:
    def __init__(self, data):
        self.data = data

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return json.dumps(self.data).encode()


class CoverageTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.payload = {"latitude": -11.86, "longitude": -55.51}

    @patch("raizes_api.coverage.urlopen")
    def test_available_and_missing_are_separate(self, open_url):
        open_url.return_value = FakeResponse({"properties": {"parameter": {
            "T2M": {"JAN": 25.1}, "PRECTOTCORR": {"JAN": -999},
        }}})
        response = self.client.post("/api/v1/areas/coverage", json={**self.payload, "soil_known": True})
        self.assertEqual(response.status_code, 200)
        result = response.json()
        statuses = {item["key"]: item["status"] for item in result["items"]}
        self.assertEqual(statuses["soil"], "available")
        self.assertEqual(statuses["water_regime"], "missing")
        self.assertEqual(statuses["temperature"], "available")
        self.assertEqual(statuses["precipitation"], "missing")
        self.assertFalse(result["recommendation_ready"])

    @patch("raizes_api.coverage.urlopen", side_effect=TimeoutError)
    def test_service_error_is_unverified(self, _):
        response = self.client.post("/api/v1/areas/coverage", json=self.payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["status"] for item in response.json()["items"][-2:]],
                         ["unverified", "unverified"])

    def test_invalid_coordinates_rejected(self):
        response = self.client.post("/api/v1/areas/coverage", json={"latitude": 91, "longitude": 0})
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
