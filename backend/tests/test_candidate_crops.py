import unittest

from fastapi.testclient import TestClient
from pydantic import ValidationError

from raizes_api.candidate_crops import CandidateCropsInput, validate_candidate_crops
from raizes_api.main import app


class CandidateCropsTest(unittest.TestCase):
    def test_known_crops_stay_candidates_without_eligibility_claim(self):
        payload = CandidateCropsInput.model_validate(
            {"status": "known", "crops": [" Soja ", "Milho"]}
        )
        result = validate_candidate_crops(payload)
        self.assertEqual(result.candidate_crops.crops, ["Soja", "Milho"])
        self.assertFalse(result.eligibility_evaluated)
        self.assertEqual(result.missing_for_analysis, [])

    def test_unknown_is_explicit_gap(self):
        result = validate_candidate_crops(CandidateCropsInput(status="unknown"))
        self.assertEqual(result.candidate_crops.crops, [])
        self.assertEqual(result.missing_for_analysis, ["candidate_crops"])

    def test_unknown_cannot_list_crops(self):
        with self.assertRaises(ValidationError):
            CandidateCropsInput(status="unknown", crops=["Soja"])

    def test_known_requires_unique_crop_names(self):
        for crops in [[], ["Soja", " soja "]]:
            with self.subTest(crops=crops), self.assertRaises(ValidationError):
                CandidateCropsInput(status="known", crops=crops)

    def test_api_returns_candidate_status(self):
        response = TestClient(app).post(
            "/api/v1/areas/candidate-crops/validate",
            json={"status": "known", "crops": ["Soja"]},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["candidate_crops"]["crops"], ["Soja"])
        self.assertIs(response.json()["eligibility_evaluated"], False)


if __name__ == "__main__":
    unittest.main()
