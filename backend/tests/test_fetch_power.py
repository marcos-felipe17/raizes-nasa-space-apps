import json
import tempfile
import unittest
from pathlib import Path

from scripts.fetch_power import build_document, build_url, fetch_cached

FAKE = {
    "header": {"fill_value": -999, "api": {"version": "2.10.1"}},
    "parameters": {"PRECTOTCORR": {"units": "mm/day"}, "T2M": {"units": "C"}},
    "properties": {
        "parameter": {
            "PRECTOTCORR": {"20200101": 9.9, "20200102": -999},
            "T2M": {"20200101": 27.1, "20200102": 26.8},
        }
    },
}


class FetchPowerTest(unittest.TestCase):
    def test_url_has_expected_parameters(self):
        url = build_url(-11.86, -55.5, "20200101", "20201231")
        self.assertIn("parameters=PRECTOTCORR%2CT2M", url)
        self.assertIn("community=AG", url)
        self.assertIn("/api/temporal/daily/point?", url)

    def test_document_keeps_values_and_metadata(self):
        doc = build_document("teste", -11.86, -55.5, "20200101", "20200102", fetch=lambda _: FAKE)
        self.assertEqual(doc["diario"]["PRECTOTCORR"]["20200102"], -999)  # sem alterar o fill
        self.assertEqual(doc["unidades"]["T2M"], "C")
        self.assertEqual(doc["fill_value"], -999)
        self.assertIn("url_requisicao", doc)
        self.assertIn("data_download", doc)

    def test_missing_parameter_is_rejected(self):
        with self.assertRaises(ValueError):
            build_document("x", 0, 0, "20200101", "20200102", fetch=lambda _: {"properties": {}})

    def test_inverted_period_is_rejected(self):
        with self.assertRaises(ValueError):
            build_document("x", 0, 0, "20210101", "20200101", fetch=lambda _: FAKE)

    def test_existing_file_is_not_downloaded_again(self):
        calls = []

        def fetch(url):
            calls.append(url)
            return FAKE

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            path, downloaded = fetch_cached("teste", 0, 0, "20200101", "20200102", out, fetch)
            self.assertTrue(downloaded)
            self.assertEqual(json.loads(path.read_text(encoding="utf-8"))["local"], "teste")

            again, downloaded_again = fetch_cached("teste", 0, 0, "20200101", "20200102", out, fetch)
            self.assertEqual(again, path)
            self.assertFalse(downloaded_again)
            self.assertEqual(len(calls), 1)  # a segunda chamada não consulta a API


if __name__ == "__main__":
    unittest.main()
