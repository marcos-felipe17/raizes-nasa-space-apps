import unittest

from pydantic import ValidationError

from raizes_api.main import app
from raizes_api.soil import SoilInput, validate_soil


class SoilContractTest(unittest.TestCase):
    def test_farmer_description_is_accepted_with_provenance(self):
        soil = SoilInput.model_validate(
            {
                "status": "known",
                "description": "Solo argiloso informado pelo agricultor",
                "source": "farmer",
            }
        )
        result = validate_soil(soil)
        self.assertEqual(result.missing_for_analysis, [])
        self.assertEqual(result.soil.source, "farmer")

    def test_unknown_is_valid_and_marked_missing(self):
        soil = SoilInput.model_validate({"status": "unknown"})
        self.assertEqual(validate_soil(soil).missing_for_analysis, ["soil"])

    def test_external_classification_requires_reference(self):
        with self.assertRaises(ValidationError):
            SoilInput.model_validate(
                {"status": "known", "classification": "Mollisol", "source": "external"}
            )

    def test_external_classification_keeps_reference(self):
        soil = SoilInput.model_validate(
            {
                "status": "known",
                "classification": "Mollisol",
                "source": "external",
                "source_reference": "USDA NRCS SSURGO",
            }
        )
        self.assertEqual(validate_soil(soil).soil.source_reference, "USDA NRCS SSURGO")

    def test_unknown_cannot_carry_a_classification(self):
        with self.assertRaises(ValidationError):
            SoilInput.model_validate({"status": "unknown", "classification": "Mollisol"})

    def test_api_route_is_registered(self):
        paths = {route.path for route in app.routes}
        self.assertIn("/api/v1/areas/soil/validate", paths)


if __name__ == "__main__":
    unittest.main()
