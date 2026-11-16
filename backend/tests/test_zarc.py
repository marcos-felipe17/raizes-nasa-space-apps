"""Motor do ZARC com a Tábua de Risco 2025/2026 versionada em data/fixtures/zarc/.

Os casos usam linhas reais da tábua (Sinop-MT e Caruaru-PE). Se a tábua for
trocada por outra safra, os decêndios esperados podem mudar.
"""

import unittest

from fastapi.testclient import TestClient

from raizes_api import zarc
from raizes_api.main import app


def avaliar(**dados):
    return zarc.evaluate(zarc.ZarcInput(**dados))


SINOP = {"uf": "MT", "municipality": "Sinop", "water_regime": "rainfed"}


class ZarcEvaluationTest(unittest.TestCase):
    def test_soja_no_fim_de_outubro_em_sinop_e_elegivel_com_risco_de_20(self):
        safra = avaliar(**SINOP, seasons=[{"crop": "Soja", "planting_decendio": 30}]).seasons[0]
        self.assertEqual((safra.status, safra.reason), ("eligible", "indicated"))
        self.assertEqual((safra.risk_min, safra.risk_max), (20, 20))
        self.assertTrue(safra.ordinances[0].startswith("Portaria nº"))

    def test_soja_em_maio_fica_fora_da_janela_e_mostra_a_epoca_indicada(self):
        safra = avaliar(**SINOP, seasons=[{"crop": "Soja", "planting_decendio": 15}]).seasons[0]
        self.assertEqual((safra.status, safra.reason), ("excluded", "out_of_window"))
        self.assertIn(30, safra.indicated_always)
        self.assertIsNone(safra.risk_min)

    def test_cultura_que_o_zarc_nao_cobre_e_sem_cobertura_e_nao_excluida(self):
        safra = avaliar(**SINOP, seasons=[{"crop": "Mandioca", "planting_decendio": 5}]).seasons[0]
        self.assertEqual((safra.status, safra.reason), ("no_coverage", "crop_not_zoned"))

    def test_municipio_fora_da_tabua_e_sem_cobertura(self):
        resultado = avaliar(uf="XX", municipality="Nenhum", water_regime="rainfed",
                            seasons=[{"crop": "Soja", "planting_decendio": 30}])
        self.assertEqual(resultado.status, "no_coverage")
        self.assertIsNone(resultado.municipality)

    def test_regime_irrigado_sem_zoneamento_e_sem_cobertura(self):
        safra = avaliar(uf="MT", municipality="Sinop", water_regime="irrigated",
                        seasons=[{"crop": "Soja", "planting_decendio": 30}]).seasons[0]
        self.assertEqual(safra.reason, "regime_not_zoned")

    def test_resultado_que_muda_com_solo_ou_ciclo_fica_inconclusivo_com_faixa_de_risco(self):
        safra = avaliar(**SINOP, seasons=[{"crop": "Milho", "planting_decendio": 5}]).seasons[0]
        self.assertEqual((safra.status, safra.reason), ("inconclusive", "depends_on_soil_or_cycle"))
        self.assertLessEqual(safra.risk_min, safra.risk_max)
        self.assertTrue(safra.depends_on)

    def test_mesma_cultura_em_safras_seguidas_e_excluida(self):
        resultado = avaliar(**SINOP, seasons=[
            {"crop": "Soja", "planting_decendio": 30}, {"crop": " soja ", "planting_decendio": 5},
        ])
        self.assertEqual(resultado.seasons[1].reason, "same_crop_in_sequence")
        self.assertEqual(resultado.status, "excluded")

    def test_estado_da_rotacao_e_o_pior_entre_as_safras(self):
        resultado = avaliar(**SINOP, seasons=[
            {"crop": "Soja", "planting_decendio": 30}, {"crop": "Mandioca", "planting_decendio": 5},
        ])
        self.assertEqual(resultado.status, "no_coverage")

    def test_aceita_mais_de_duas_safras(self):
        resultado = avaliar(**SINOP, seasons=[
            {"crop": "Soja", "planting_decendio": 30}, {"crop": "Milho", "planting_decendio": 5},
            {"crop": "Sorgo", "planting_decendio": 8},
        ])
        self.assertEqual(len(resultado.seasons), 3)

    def test_textura_informada_filtra_linhas_classificadas_por_textura(self):
        resultado = avaliar(uf="PE", municipality="Caruaru", water_regime="rainfed", soil_texture=2,
                            seasons=[{"crop": "Milho", "planting_decendio": 15}])
        self.assertTrue(resultado.soil_used)

    def test_resultado_sempre_cita_a_fonte_e_a_safra(self):
        resultado = avaliar(**SINOP, seasons=[{"crop": "Soja", "planting_decendio": 30}])
        self.assertEqual(resultado.source.crop_year, "2025/2026")
        self.assertIn("dados.agricultura.gov.br", resultado.source.url)


class ZarcCoverageTest(unittest.TestCase):
    def test_lista_culturas_e_janelas_do_municipio(self):
        resultado = zarc.coverage(zarc.CoverageInput(uf="MT", municipality="Sinop"))
        self.assertTrue(resultado.covered)
        self.assertIn("Soja", resultado.crops)
        self.assertNotIn("Mandioca", resultado.crops)
        janela = next(item for item in resultado.windows if item.crop == "Soja")
        self.assertIn(30, janela.indicated_always)
        self.assertTrue(set(janela.indicated_always) <= set(janela.indicated_sometimes))
        self.assertTrue(set(janela.lowest_risk) <= set(janela.indicated_always))
        self.assertIn(30, janela.lowest_risk)

    def test_acha_o_municipio_pelo_codigo_do_ibge(self):
        resultado = zarc.coverage(zarc.CoverageInput(uf="MT", ibge_code="5107909"))
        self.assertEqual(resultado.municipality, "Sinop")

    def test_nome_sem_acento_tambem_encontra(self):
        self.assertTrue(zarc.coverage(zarc.CoverageInput(uf="PE", municipality="caruaru")).covered)


class ZarcApiTest(unittest.TestCase):
    def test_rotas_respondem(self):
        client = TestClient(app)
        cobertura = client.post("/api/v1/zarc/coverage", json={"uf": "MT", "municipality": "Sinop"})
        self.assertEqual(cobertura.status_code, 200)
        avaliacao = client.post("/api/v1/zarc/evaluate", json={
            **SINOP, "seasons": [{"crop": "Soja", "planting_decendio": 30}],
        })
        self.assertEqual(avaliacao.json()["status"], "eligible")

    def test_rejeita_decendio_fora_de_1_a_36(self):
        resposta = TestClient(app).post("/api/v1/zarc/evaluate", json={
            **SINOP, "seasons": [{"crop": "Soja", "planting_decendio": 37}],
        })
        self.assertEqual(resposta.status_code, 422)
