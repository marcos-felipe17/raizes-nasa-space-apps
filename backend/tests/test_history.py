import unittest

from pydantic import ValidationError

from raizes_api.history import CultivationHistoryInput, validate_cultivation_history
from raizes_api.main import app


class CultivationHistoryTest(unittest.TestCase):
    def test_preserves_crop_order_and_periods(self):
        payload = {
            "periods": [
                {"crop": "Soja", "start_month": "2024-10", "end_month": "2025-02"},
                {"crop": "Milho", "start_month": "2025-03", "end_month": "2025-07"},
            ]
        }
        result = validate_cultivation_history(CultivationHistoryInput.model_validate(payload))
        self.assertEqual(result.history.model_dump()["periods"], payload["periods"])

    def test_rejects_reversed_period(self):
        with self.assertRaises(ValidationError):
            CultivationHistoryInput.model_validate(
                {"periods": [{"crop": "Soja", "start_month": "2025-03", "end_month": "2025-02"}]}
            )

    def test_rejects_out_of_order_periods(self):
        with self.assertRaises(ValidationError):
            CultivationHistoryInput.model_validate(
                {"periods": [
                    {"crop": "Milho", "start_month": "2025-03", "end_month": "2025-07"},
                    {"crop": "Soja", "start_month": "2024-10", "end_month": "2025-02"},
                ]}
            )

    def test_rejects_invalid_month_and_empty_history(self):
        for payload in [
            {"periods": []},
            {"periods": [{"crop": "Soja", "start_month": "2025-13", "end_month": "2025-14"}]},
        ]:
            with self.subTest(payload=payload), self.assertRaises(ValidationError):
                CultivationHistoryInput.model_validate(payload)

    def test_history_route_is_registered(self):
        self.assertIn("/api/v1/areas/history/validate", {route.path for route in app.routes})


if __name__ == "__main__":
    unittest.main()
