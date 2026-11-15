import unittest

from pydantic import ValidationError

from raizes_api.main import app
from raizes_api.profile import AreaProfileInput, validate_area_profile


class AreaProfileTest(unittest.TestCase):
    def test_rainfed_regime_is_kept_in_profile(self):
        profile = AreaProfileInput.model_validate(
            {"soil": {"status": "unknown"}, "water_regime": "rainfed"}
        )
        result = validate_area_profile(profile)
        self.assertEqual(result.profile.water_regime, "rainfed")
        self.assertEqual(result.missing_for_analysis, ["soil"])

    def test_irrigated_regime_is_kept_in_profile(self):
        profile = AreaProfileInput.model_validate(
            {
                "soil": {
                    "status": "known",
                    "description": "Solo argiloso",
                    "source": "farmer",
                },
                "water_regime": "irrigated",
            }
        )
        result = validate_area_profile(profile)
        self.assertEqual(result.profile.water_regime, "irrigated")
        self.assertEqual(result.missing_for_analysis, [])

    def test_regime_is_required(self):
        with self.assertRaises(ValidationError):
            AreaProfileInput.model_validate({"soil": {"status": "unknown"}})

    def test_mixed_regime_needs_a_separate_area(self):
        with self.assertRaises(ValidationError):
            AreaProfileInput.model_validate(
                {"soil": {"status": "unknown"}, "water_regime": "mixed"}
            )

    def test_profile_route_is_registered(self):
        paths = {route.path for route in app.routes}
        self.assertIn("/api/v1/areas/profile/validate", paths)


if __name__ == "__main__":
    unittest.main()
