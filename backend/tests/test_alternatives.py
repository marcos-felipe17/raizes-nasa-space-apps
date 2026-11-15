import unittest

from fastapi.testclient import TestClient

from raizes_api.alternatives import (
    AlternativeGenerationInput,
    RegionBounds,
    VerifiedRegion,
    generate_alternatives,
)
from raizes_api.main import app


PROPOSAL = {"seasons": [
    {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
    {"crop": "milho", "start_month": "2027-05", "end_month": "2027-08"},
]}
OTHER = {"seasons": [
    {"crop": "soja", "start_month": "2027-01", "end_month": "2027-04"},
    {"crop": "milheto", "start_month": "2027-05", "end_month": "2027-08"},
]}


def verified_region():
    """Synthetic test-only context; never registered in the production catalog."""
    return VerifiedRegion(
        id="synthetic-test-region", name="Contexto sintético de teste",
        bounds=RegionBounds(south=-12, north=-11, west=-56, east=-55),
        source_url="https://example.org/synthetic-test-only", source_version="test-v1",
        sequences=[PROPOSAL, OTHER],
    )


class AlternativeGenerationTest(unittest.TestCase):
    def setUp(self):
        self.payload = {
            "latitude": -11.5, "longitude": -55.5,
            "proposal": PROPOSAL,
            "candidate_crops": {"status": "known", "crops": ["soja", "milho", "milheto"]},
        }

    def test_api_blocks_when_no_region_is_audited(self):
        response = TestClient(app).post("/api/v1/areas/alternatives/generate", json=self.payload)
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result["status"], "blocked")
        self.assertEqual(result["alternatives"], [])
        self.assertIn("verified_region_rules", result["missing_for_generation"])

    def test_generates_only_sourced_distinct_alternative_from_verified_context(self):
        payload = AlternativeGenerationInput.model_validate(self.payload)
        result = generate_alternatives(payload, [verified_region()])
        self.assertEqual(result.status, "generated")
        self.assertEqual(len(result.alternatives), 1)
        self.assertEqual(result.alternatives[0].seasons[1].crop, "milheto")
        self.assertEqual(result.alternatives[0].status, "explore_only")
        self.assertNotIn("r", result.model_dump())

    def test_blocks_outside_verified_region(self):
        payload = AlternativeGenerationInput.model_validate({**self.payload, "latitude": 40})
        result = generate_alternatives(payload, [verified_region()])
        self.assertEqual(result.status, "blocked")
        self.assertEqual(result.alternatives, [])

    def test_blocks_when_candidate_list_is_unknown(self):
        payload = AlternativeGenerationInput.model_validate({
            **self.payload, "candidate_crops": {"status": "unknown", "crops": []},
        })
        result = generate_alternatives(payload, [verified_region()])
        self.assertEqual(result.status, "blocked")
        self.assertIn("candidate_crops", result.missing_for_generation)

    def test_does_not_propose_crops_outside_farmer_candidates(self):
        payload = AlternativeGenerationInput.model_validate({
            **self.payload, "candidate_crops": {"status": "known", "crops": ["soja", "milho"]},
        })
        result = generate_alternatives(payload, [verified_region()])
        self.assertEqual(result.status, "blocked")
        self.assertEqual(result.missing_for_generation, ["applicable_sequence"])

    def test_client_cannot_claim_a_region_is_verified(self):
        response = TestClient(app).post("/api/v1/areas/alternatives/generate", json={
            **self.payload, "verified_region": True,
        })
        self.assertEqual(response.status_code, 422)

    def test_ambiguous_overlapping_regions_block(self):
        payload = AlternativeGenerationInput.model_validate(self.payload)
        region = verified_region()
        result = generate_alternatives(payload, [region, region.model_copy(update={"id": "another"})])
        self.assertEqual(result.status, "blocked")


if __name__ == "__main__":
    unittest.main()
