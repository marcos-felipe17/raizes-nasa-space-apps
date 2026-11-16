"""Tests for UC-18: consulting comparable reports with similarities, differences and exclusions."""

import unittest

from fastapi.testclient import TestClient

from raizes_api.main import app


class ReportsConsultationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_returns_similarities_differences_and_exclusions(self) -> None:
        response = self.client.post(
            "/api/v1/areas/reports/consult",
            json={
                "place": "Sinop, MT",
                "latitude": -11.8609,
                "longitude": -55.5053,
                "water_regime": "rainfed",
                "soil": {
                    "status": "known",
                    "classification": "Textura argilosa",
                    "source": "farmer",
                },
                "proposal": {
                    "seasons": [
                        {"crop": "Soja", "start_month": "2026-11", "end_month": "2027-02"},
                        {"crop": "Milho", "start_month": "2027-03", "end_month": "2027-06"},
                    ]
                },
            },
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()

        self.assertEqual(body["q_indicator"], "unavailable")
        self.assertGreaterEqual(body["total_catalog"], 5)
        self.assertTrue(len(body["comparable_reports"]) >= 1)
        self.assertTrue(len(body["excluded_reports"]) >= 1)

        top = body["comparable_reports"][0]
        self.assertFalse(top["excluded"])
        self.assertEqual(top["report"]["id"], "demo-sinop-soja-milho")
        self.assertTrue(any("Mesmo regime hídrico" in item for item in top["similarities"]))
        self.assertTrue(any("Cultura(s) em comum" in item for item in top["similarities"]))
        self.assertTrue(any("Mesmo tipo de solo" in item for item in top["similarities"]))
        self.assertTrue(any("Região próxima" in item for item in top["similarities"]))

        # Boone, IA shares crops and regime, but differs in soil and distance
        boone = next(
            item for item in body["comparable_reports"] if item["report"]["id"] == "demo-boone-milho-soja"
        )
        self.assertTrue(any("Solo diferente" in item for item in boone["differences"]))
        self.assertTrue(any("Localização distante" in item for item in boone["differences"]))

        # Petrolina, PE is irrigated, so it must be excluded for a rainfed query
        petrolina = next(
            item
            for item in body["excluded_reports"]
            if item["report"]["id"] == "demo-petrolina-feijao-milho-irrigado"
        )
        self.assertTrue(petrolina["excluded"])
        self.assertTrue(any("Regime hídrico incompatível" in item for item in petrolina["exclusion_reasons"]))

    def test_works_without_proposal_and_with_unknown_soil(self) -> None:
        response = self.client.post(
            "/api/v1/areas/reports/consult",
            json={
                "water_regime": "irrigated",
                "soil": {"status": "unknown"},
            },
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body["comparable_reports"]), 1)
        self.assertEqual(
            body["comparable_reports"][0]["report"]["id"],
            "demo-petrolina-feijao-milho-irrigado",
        )
        self.assertTrue(
            any("Solo da sua área não especificado" in item for item in body["comparable_reports"][0]["differences"])
        )
        self.assertEqual(len(body["excluded_reports"]), body["total_catalog"] - 1)


if __name__ == "__main__":
    unittest.main()
