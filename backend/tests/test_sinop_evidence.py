import unittest

from fastapi.testclient import TestClient

from raizes_api.main import app
from raizes_api.sinop_evidence import get_sinop_evidence


class SinopEvidenceTest(unittest.TestCase):
    def test_published_observations_keep_year_treatment_and_units(self):
        result = get_sinop_evidence()
        treatments = {row.treatment_id: row for row in result.experiment.observations}
        self.assertEqual(set(treatments), {"soy_maize", "soy_millet", "soy_maize_brachiaria"})
        self.assertEqual(treatments["soy_maize_brachiaria"].measurements[0].two_season_straw_kg_ha, 15479)
        self.assertEqual(treatments["soy_maize_brachiaria"].measurements[1].two_season_straw_kg_ha, 16468)
        self.assertEqual(treatments["soy_millet"].measurements[1].soy_grain_kg_ha, 2842)
        self.assertEqual(result.experiment.source.tables, [2, 3, 4])

    def test_nasa_context_is_separate_and_does_not_verify_generation(self):
        result = get_sinop_evidence()
        self.assertEqual(result.nasa_power.valid_days["T2M"], 4018)
        self.assertEqual(result.nasa_power.valid_days["PRECTOTCORR"], 4018)
        self.assertEqual(result.nasa_power.missing_days["T2M"], 0)
        self.assertEqual(result.nasa_power.role, "environmental_context_only")
        self.assertFalse(result.region_verified_for_generation)
        self.assertFalse(result.experiment.verified_for_generation)

    def test_api_exposes_sources_and_gaps_without_score(self):
        response = TestClient(app).get("/api/v1/regions/sinop/evidence")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["experiment"]["plot_area_m2"], 30)
        self.assertTrue(data["experiment"]["source"]["url"].startswith("https://"))
        self.assertTrue(data["experiment"]["missing_for_field_recommendation"])
        self.assertNotIn("score", data)
        self.assertNotIn("indicator_r", data)


if __name__ == "__main__":
    unittest.main()
