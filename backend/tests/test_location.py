import unittest

from raizes_api.location import (
    LocationInput,
    LocationNotFound,
    UpstreamError,
    geocode,
    resolve_location,
)

PETROLINA_HIT = [{"lat": "-9.3891", "lon": "-40.5027", "display_name": "Petrolina, PE, Brasil"}]
POWER_OK = {
    "properties": {
        "parameter": {
            "T2M": {"JAN": 27.1, "ANN": 26.4},
            "PRECTOTCORR": {"JAN": 2.5, "ANN": -999},
        }
    }
}


def fake_get_json(nominatim=PETROLINA_HIT, power=POWER_OK):
    def get_json(url):
        if url.startswith("https://nominatim"):
            if isinstance(nominatim, Exception):
                raise nominatim
            return nominatim
        if isinstance(power, Exception):
            raise power
        return power

    return get_json


class LocationTest(unittest.TestCase):
    def test_resolves_coordinates_and_climate_context(self):
        result = resolve_location(LocationInput(place="Petrolina, PE"), fake_get_json())
        self.assertAlmostEqual(result.coordinates.lat, -9.3891)
        self.assertEqual(result.climate.status, "ok")
        self.assertEqual(result.climate.temperature_2m_c["ANN"], 26.4)
        self.assertIn("não alteram", result.note)

    def test_power_fill_value_becomes_none(self):
        result = resolve_location(LocationInput(place="Petrolina, PE"), fake_get_json())
        self.assertIsNone(result.climate.precipitation_mm_dia["ANN"])

    def test_unknown_place_raises_not_found(self):
        with self.assertRaises(LocationNotFound):
            geocode("Lugar Inexistente", fake_get_json(nominatim=[]))

    def test_geocoder_outage_raises_upstream_error(self):
        with self.assertRaises(UpstreamError):
            geocode("Petrolina", fake_get_json(nominatim=TimeoutError()))

    def test_nasa_outage_keeps_coordinates_and_marks_climate_unavailable(self):
        result = resolve_location(
            LocationInput(place="Petrolina, PE"),
            fake_get_json(power=TimeoutError()),
        )
        self.assertEqual(result.coordinates.display_name, "Petrolina, PE, Brasil")
        self.assertEqual(result.climate.status, "unavailable")
        self.assertIsNone(result.climate.temperature_2m_c)

    def test_nasa_unexpected_shape_is_unavailable(self):
        result = resolve_location(
            LocationInput(place="Petrolina, PE"),
            fake_get_json(power={"properties": {}}),
        )
        self.assertEqual(result.climate.status, "unavailable")


if __name__ == "__main__":
    unittest.main()
