"""Consulta de CEP (ViaCEP) para preencher município, UF e código IBGE da área."""

from __future__ import annotations

import json
import re
import urllib.request
from collections.abc import Callable
from typing import Any

from pydantic import BaseModel

VIACEP_URL = "https://viacep.com.br/ws/{cep}/json/"
TIMEOUT_S = 8

GetJson = Callable[[str], Any]


class CepResult(BaseModel):
    cep: str
    municipality: str
    uf: str
    ibge_code: str
    provenance: str = "ViaCEP"


class CepInvalid(Exception):
    """CEP com formato inválido."""


class CepNotFound(Exception):
    """CEP inexistente."""


class CepUpstreamError(Exception):
    """Falha ao consultar o serviço de CEP."""


def _get_json(url: str) -> Any:
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
        return json.loads(response.read().decode("utf-8"))


def lookup_cep(cep: str, get_json: GetJson = _get_json) -> CepResult:
    digits = re.sub(r"\D", "", cep)
    if len(digits) != 8:
        raise CepInvalid(cep)
    try:
        data = get_json(VIACEP_URL.format(cep=digits))
    except (OSError, ValueError) as exc:
        raise CepUpstreamError("serviço de CEP indisponível") from exc
    if not isinstance(data, dict) or data.get("erro"):
        raise CepNotFound(digits)
    try:
        municipality, uf, ibge = str(data["localidade"]), str(data["uf"]), str(data["ibge"])
    except KeyError as exc:
        raise CepUpstreamError("resposta inesperada do serviço de CEP") from exc
    if not (municipality and re.fullmatch(r"[A-Z]{2}", uf) and re.fullmatch(r"\d{7}", ibge)):
        raise CepUpstreamError("resposta incompleta do serviço de CEP")
    return CepResult(cep=f"{digits[:5]}-{digits[5:]}", municipality=municipality, uf=uf, ibge_code=ibge)
