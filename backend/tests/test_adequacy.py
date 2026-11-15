import unittest
from fastapi.testclient import TestClient
from raizes_api.main import app

class AdequacaoTest(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.proposal = {
            "seasons": [
                {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
                {"crop": "milho", "start_month": "2027-05", "end_month": "2027-08"},
            ]
        }

    def test_excluded_proposal_has_no_r_score(self):
        response = self.client.post("/api/v1/areas/adequacao", json={
            "proposal": self.proposal,
            "status_restricao": "excluded",
            "dados_completos": True
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "excluido")
        self.assertIsNone(data["indicador_r"])

    def test_inconclusive_proposal_abstains_from_r_score(self):
        response = self.client.post("/api/v1/areas/adequacao", json={
            "proposal": self.proposal,
            "status_restricao": "inconclusive",
            "dados_completos": False
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "inconclusivo")
        self.assertIsNone(data["indicador_r"])

    def test_eligible_proposal_returns_r_with_limits_and_criteria(self):
        response = self.client.post("/api/v1/areas/adequacao", json={
            "proposal": self.proposal,
            "status_restricao": "passed",
            "dados_completos": True,
            "prioridade": "conservacao_agua"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "elegivel")
        self.assertIsNotNone(data["indicador_r"])
        self.assertTrue(len(data["criterios_avaliados"]) > 0)
        self.assertTrue(len(data["limitacoes"]) > 0)

    def test_economic_priority_marks_financial_criterion_as_unscored(self):
        response = self.client.post("/api/v1/areas/adequacao", json={
            "proposal": self.proposal,
            "status_restricao": "passed",
            "dados_completos": True,
            "prioridade": "renda_economica"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(any("RN-08" in item for item in data["criterios_nao_avaliados"]))

if __name__ == "__main__":
    unittest.main()