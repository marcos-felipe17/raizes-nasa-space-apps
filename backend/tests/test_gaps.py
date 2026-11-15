import json
from pathlib import Path
import unittest

from fastapi.testclient import TestClient

from raizes_api.gaps import identify_gaps
from raizes_api.main import app


def complete_payload() -> dict:
    return {
        "soil": {
            "soil": {
                "status": "known",
                "description": "Latossolo argiloso bem drenado",
                "source": "farmer",
            },
            "missing_for_analysis": [],
        },
        "profile": {
            "profile": {
                "soil": {
                    "status": "known",
                    "description": "Latossolo argiloso bem drenado",
                    "source": "farmer",
                },
                "water_regime": "rainfed",
            },
            "missing_for_analysis": [],
        },
        "history": {
            "history": {
                "periods": [
                    {"crop": "soja", "start_month": "2024-10", "end_month": "2025-02"},
                    {"crop": "milho", "start_month": "2025-03", "end_month": "2025-07"},
                ]
            }
        },
        "candidate_crops": {
            "candidate_crops": {"status": "known", "crops": ["soja", "milho"]},
            "eligibility_evaluated": False,
            "missing_for_analysis": [],
        },
        "coverage": {
            "latitude": -11.86,
            "longitude": -55.51,
            "items": [
                {
                    "key": "soil",
                    "label": "Solo",
                    "status": "available",
                    "source": "Informado pelo agricultor",
                    "detail": "Registrado neste navegador.",
                },
                {
                    "key": "water_regime",
                    "label": "Regime hídrico",
                    "status": "available",
                    "source": "Informado pelo agricultor",
                    "detail": "Registrado neste navegador.",
                },
                {
                    "key": "history",
                    "label": "Histórico de cultivo",
                    "status": "available",
                    "source": "Informado pelo agricultor",
                    "detail": "Registrado neste navegador.",
                },
                {
                    "key": "candidate_crops",
                    "label": "Culturas candidatas",
                    "status": "available",
                    "source": "Informado pelo agricultor",
                    "detail": "Registrado neste navegador.",
                },
                {
                    "key": "temperature",
                    "label": "Temperatura do ar",
                    "status": "available",
                    "source": "NASA POWER · climatologia",
                    "detail": "Climatologia retornada para o ponto informado.",
                },
                {
                    "key": "precipitation",
                    "label": "Precipitação",
                    "status": "available",
                    "source": "NASA POWER · climatologia",
                    "detail": "Climatologia retornada para o ponto informado.",
                },
            ],
            "recommendation_ready": False,
        },
        "rotation_proposal": {
            "proposal": {
                "seasons": [
                    {"crop": "soja", "start_month": "2026-10", "end_month": "2027-02"},
                    {"crop": "milho", "start_month": "2027-03", "end_month": "2027-07"},
                ]
            },
            "analysis_performed": False,
        },
    }


class GapsTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_missing_essential_data_is_inconclusive_and_r_is_none(self):
        payload = complete_payload()
        payload["soil"] = {"soil": {"status": "unknown"}, "missing_for_analysis": ["soil"]}
        payload["profile"]["profile"]["soil"] = {"status": "unknown"}

        response = self.client.post("/api/v1/areas/gaps", json=payload)
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "inconclusive")
        self.assertIsNone(body["r_score"])
        gap_codes = [gap["code"] for gap in body["gaps"]]
        self.assertIn("soil", gap_codes)
        soil_eval = next(e for e in body["evaluations"] if e["required_code"] == "soil")
        self.assertEqual(soil_eval["status"], "inconclusive")
        self.assertIsNone(soil_eval["r_score"])

    def test_no_gaps_returns_no_gaps_identified_and_never_asserts_eligibility(self):
        response = self.client.post("/api/v1/areas/gaps", json=complete_payload())
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "no_gaps_identified")
        self.assertEqual(body["gaps"], [])
        self.assertEqual(body["unverified_items"], [])
        self.assertFalse(body["eligibility_evaluated"])
        self.assertFalse(body["recommendation_ready"])
        self.assertIsNone(body["r_score"])

        serialized = json.dumps(body, ensure_ascii=False).lower()
        for forbidden in ("elegível", "eligible", "melhor rotação", "seguro para plantio", "recomendado"):
            self.assertNotIn(forbidden, serialized)

    def test_crop_without_regional_rule_is_no_coverage_with_placeholder_notice(self):
        response = self.client.post("/api/v1/areas/gaps", json=complete_payload())
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(
            body["regional_rules_notice"],
            "Regras regionais ainda não auditadas (ADR-0003)",
        )
        self.assertEqual(len(body["regional_rules_coverage"]), 2)
        for item in body["regional_rules_coverage"]:
            self.assertEqual(item["status"], "no_coverage")
            self.assertTrue(item["placeholder"])
            self.assertEqual(item["source"], "PLACEHOLDER")
            self.assertIn("Regras regionais ainda não auditadas (ADR-0003)", item["detail"])
            self.assertNotIn("proibida", item["detail"].lower().replace("não cultura proibida", ""))
            self.assertNotEqual(item["status"], "prohibited")
            self.assertNotEqual(item["status"], "excluded")

    def test_absence_never_becomes_zero(self):
        result = identify_gaps({})
        dumped = result.model_dump()
        self.assertIsNone(dumped["r_score"])
        self.assertNotEqual(dumped["r_score"], 0)
        self.assertNotEqual(dumped["r_score"], 0.0)
        for evaluation in dumped["evaluations"]:
            self.assertIsNone(evaluation["r_score"])
            self.assertNotEqual(evaluation["r_score"], 0)

    def test_unverified_is_never_labeled_as_missing_in_api_or_ui(self):
        # 1) Quando coverage está ausente, temperature e precipitation ficam unverified (nunca missing)
        payload_without_coverage = complete_payload()
        payload_without_coverage["coverage"] = None
        res_no_cov = self.client.post("/api/v1/areas/gaps", json=payload_without_coverage)
        self.assertEqual(res_no_cov.status_code, 200)
        body_no_cov = res_no_cov.json()
        gap_codes = [g["code"] for g in body_no_cov["gaps"]]
        self.assertNotIn("temperature", gap_codes)
        self.assertNotIn("precipitation", gap_codes)
        unverified_codes = {u["code"]: u for u in body_no_cov["unverified_items"]}
        self.assertEqual(set(unverified_codes.keys()), {"temperature", "precipitation"})
        for item in unverified_codes.values():
            self.assertEqual(item["status"], "unverified")
            self.assertIn("/cobertura", item["detail"])

        # 2) Quando a cobertura traz status unverified, permanece em unverified_items e não em gaps
        payload_unverified = complete_payload()
        for item in payload_unverified["coverage"]["items"]:
            if item["key"] in ("temperature", "precipitation"):
                item["status"] = "unverified"
        res_unv = self.client.post("/api/v1/areas/gaps", json=payload_unverified)
        body_unv = res_unv.json()
        self.assertEqual([g["code"] for g in body_unv["gaps"]], [])
        self.assertEqual(
            [u["code"] for u in body_unv["unverified_items"]],
            ["temperature", "precipitation"],
        )

        # 3) A interface mantém rótulos distintos para missing ("Ausente") e unverified ("Não verificado")
        ui_file = (
            Path(__file__).resolve().parents[2]
            / "frontend"
            / "app"
            / "lacunas"
            / "gaps-view.tsx"
        )
        ui_source = ui_file.read_text(encoding="utf-8")
        self.assertIn('missing: "Ausente"', ui_source)
        self.assertIn('unverified: "Não verificado"', ui_source)
        self.assertIn("R: não calculado nesta etapa", ui_source)

    def test_rotation_with_more_than_two_seasons_is_supported(self):
        payload = complete_payload()
        payload["rotation_proposal"] = None
        payload["seasons"] = [
            {"crop": "soja", "start_month": "2026-10", "end_month": "2027-02"},
            {"crop": "milho", "start_month": "2027-03", "end_month": "2027-07"},
            {"crop": "braquiária", "start_month": "2027-08", "end_month": "2027-10"},
            {"crop": "milheto", "start_month": "2027-11", "end_month": "2028-01"},
        ]
        response = self.client.post("/api/v1/areas/gaps", json=payload)
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "no_gaps_identified")
        self.assertNotIn("rotation_proposal", [g["code"] for g in body["gaps"]])
        self.assertEqual(
            [c["crop"] for c in body["regional_rules_coverage"]],
            ["soja", "milho", "braquiária", "milheto"],
        )

    def test_unknown_soil_and_missing_water_regime_and_missing_parts_never_return_422(self):
        # Payload vazio ou com partes faltantes retorna 200 e transforma ausências em lacunas
        empty_response = self.client.post("/api/v1/areas/gaps", json={})
        self.assertEqual(empty_response.status_code, 200)
        empty_body = empty_response.json()
        empty_codes = [g["code"] for g in empty_body["gaps"]]
        self.assertIn("soil", empty_codes)
        self.assertIn("water_regime", empty_codes)
        self.assertIn("history", empty_codes)
        self.assertIn("candidate_crops", empty_codes)
        self.assertIn("rotation_proposal", empty_codes)

        # Solo desconhecido + profile ausente + rotation_proposal ausente
        partial_payload = complete_payload()
        partial_payload["soil"] = {"soil": {"status": "unknown"}, "missing_for_analysis": ["soil"]}
        partial_payload["profile"] = None
        partial_payload["rotation_proposal"] = None

        partial_res = self.client.post("/api/v1/areas/gaps", json=partial_payload)
        self.assertEqual(partial_res.status_code, 200)
        partial_codes = [g["code"] for g in partial_res.json()["gaps"]]
        self.assertIn("soil", partial_codes)
        self.assertIn("water_regime", partial_codes)
        self.assertIn("rotation_proposal", partial_codes)


if __name__ == "__main__":
    unittest.main()
