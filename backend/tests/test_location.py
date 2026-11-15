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

    def test_malformed_geocoder_answers_raise_upstream_error(self):
        malformed = (
            [{"foo": 1}],
            {"error": "x"},
            [{"lat": "abc", "lon": "1", "display_name": "x"}],
        )
        for answer in malformed:
            with self.subTest(answer=answer):
                with self.assertRaises(UpstreamError):
                    geocode("Sinop", fake_get_json(nominatim=answer))

    def test_connection_reset_raises_upstream_error(self):
        with self.assertRaises(UpstreamError):
            geocode("Sinop", fake_get_json(nominatim=ConnectionResetError()))

    def test_malformed_nasa_answers_are_unavailable(self):
        malformed = (
            ["not", "a", "dict"],
            {"properties": {"parameter": {"T2M": {"JAN": "x"}, "PRECTOTCORR": {"JAN": 1}}}},
            {"properties": {"parameter": {"T2M": [1, 2], "PRECTOTCORR": {"JAN": 1}}}},
        )
        for answer in malformed:
            with self.subTest(answer=answer):
                result = resolve_location(
                    LocationInput(place="Sinop, MT"), fake_get_json(power=answer)
                )
                self.assertEqual(result.climate.status, "unavailable")
                self.assertAlmostEqual(result.coordinates.lat, -9.3891)

    def test_route_maps_errors_to_404_and_503(self):
        from unittest.mock import patch

        from fastapi.testclient import TestClient

        from raizes_api.main import app

        client = TestClient(app)
        url = "/api/v1/areas/location/resolve"
        # Simula a função usada pela rota; assim o teste não toca a rede.
        with patch("raizes_api.main.resolve_location", side_effect=LocationNotFound("x")):
            self.assertEqual(client.post(url, json={"place": "Nada"}).status_code, 404)
        with patch("raizes_api.main.resolve_location", side_effect=UpstreamError("x")):
            self.assertEqual(client.post(url, json={"place": "Sinop"}).status_code, 503)


if __name__ == "__main__":
    unittest.main()
