import unittest

from raizes_api.cep import CepInvalid, CepNotFound, CepUpstreamError, lookup_cep


class CepTest(unittest.TestCase):
    def test_devolve_municipio_uf_e_ibge(self):
        resultado = lookup_cep("78550-970", lambda url: {
            "localidade": "Sinop", "uf": "MT", "ibge": "5107909",
        })
        self.assertEqual((resultado.municipality, resultado.uf, resultado.ibge_code), ("Sinop", "MT", "5107909"))
        self.assertEqual(resultado.cep, "78550-970")

    def test_cep_com_formato_errado(self):
        with self.assertRaises(CepInvalid):
            lookup_cep("123", lambda url: {})

    def test_cep_inexistente(self):
        with self.assertRaises(CepNotFound):
            lookup_cep("00000000", lambda url: {"erro": "true"})

    def test_falha_de_rede_vira_erro_do_servico(self):
        def falha(url):
            raise OSError("sem rede")
        with self.assertRaises(CepUpstreamError):
            lookup_cep("78550970", falha)

    def test_resposta_incompleta_vira_erro_do_servico(self):
        with self.assertRaises(CepUpstreamError):
            lookup_cep("78550970", lambda url: {"localidade": "Sinop", "uf": "MT", "ibge": ""})
