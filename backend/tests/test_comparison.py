import unittest

from fastapi.testclient import TestClient

from raizes_api.alternatives import AlternativeGenerationInput, RegionBounds, VerifiedRegion
from raizes_api.comparison import compare_alternatives
from raizes_api.main import app


PROPOSAL = {"seasons": [
    {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
    {"crop": "milho", "start_month": "2027-05", "end_month": "2027-08"},
]}
ALTERNATIVE = {"seasons": [
    {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
    {"crop": "milheto", "start_month": "2027-05", "end_month": "2027-08"},
]}


def region():
    return VerifiedRegion(
        id="test-only", name="Região sintética de teste",
        bounds=RegionBounds(south=-12, north=-11, west=-56, east=-55),
        source_url="https://example.org/test-only", source_version="test-v1",
        sequences=[PROPOSAL, ALTERNATIVE],
    )


class ComparisonTest(unittest.TestCase):
    def setUp(self):
        self.input = {
            "latitude": -11.5, "longitude": -55.5, "proposal": PROPOSAL,
            "candidate_crops": {"status": "known", "crops": ["soja", "milho", "milheto"]},
        }

    def test_production_endpoint_shows_only_proposal_without_verified_region(self):
        response = TestClient(app).post("/api/v1/areas/alternatives/compare", json=self.input)
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["status"], "limited")
        self.assertEqual(len(result["options"]), 1)
        self.assertEqual(result["options"][0]["kind"], "proposal")
        self.assertEqual(result["options"][0]["adequacy"], "unavailable")
        self.assertIn("verified_region_rules", result["missing_for_comparison"])

    def test_side_by_side_with_test_only_verified_context(self):
        result = compare_alternatives(AlternativeGenerationInput.model_validate(self.input), (region(),))
        self.assertEqual(result.status, "ready")
        self.assertEqual([item.kind for item in result.options], ["proposal", "alternative"])
        self.assertEqual([item.regional_source for item in result.options], ["not_documented", "documented"])
        self.assertEqual(result.options[1].source_version, "test-v1")
        self.assertTrue(all(item.adequacy == "unavailable" for item in result.options))

    def test_repeated_crop_is_excluded_without_score(self):
        payload = AlternativeGenerationInput.model_validate({
            **self.input, "proposal": {"seasons": [PROPOSAL["seasons"][0], {
                "crop": "soja", "start_month": "2027-05", "end_month": "2027-08",
            }]},
        })
        result = compare_alternatives(payload, (region(),))
        self.assertEqual(result.options[0].state, "excluded")
        self.assertFalse(result.options[0].distinct_crops)
        self.assertEqual(result.options[0].adequacy, "unavailable")

    def test_unlisted_crop_is_explicit(self):
        payload = AlternativeGenerationInput.model_validate({
            **self.input, "candidate_crops": {"status": "known", "crops": ["soja", "milheto"]},
        })
        result = compare_alternatives(payload, (region(),))
        self.assertEqual(result.options[0].candidate_crops, "some_unlisted")
        self.assertEqual(result.options[1].candidate_crops, "all_listed")

    def test_client_cannot_inject_alternatives_or_scores(self):
        for field, value in (("alternatives", [ALTERNATIVE]), ("score", 100)):
            with self.subTest(field=field):
                response = TestClient(app).post(
                    "/api/v1/areas/alternatives/compare", json={**self.input, field: value},
                )
                self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
