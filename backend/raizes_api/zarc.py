"""Avaliação de safras pelo Zoneamento Agrícola de Risco Climático (ZARC/MAPA).

A fonte é a Tábua de Risco publicada nos dados abertos do MAPA, guardada sem
alteração de valores em data/fixtures/zarc/ (ADR-0017). Para cada município,
cultura, manejo, solo e grupo de ciclo, a tábua informa em quais decêndios do
ano o plantio é indicado e com qual risco climático (20, 30 ou 40%).

O motor só lê a tábua. Não interpola, não completa valor ausente e não
transforma o risco em nota: ausência de cultura ou de município é "sem
cobertura", nunca proibição.
"""

from __future__ import annotations

import csv
import gzip
import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Literal, NamedTuple

from pydantic import BaseModel, ConfigDict, Field

from .profile import WaterRegime

SAFRA = "2025-2026"
PASTA = Path(__file__).resolve().parents[2] / "data" / "fixtures" / "zarc" / SAFRA
UFS = frozenset(
    "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split()
)

# Cultura mostrada ao agricultor -> nomes usados na tábua. Variantes consorciadas ficam de fora
# para não misturar sistemas de manejo diferentes sob o mesmo nome.
CULTURAS: dict[str, tuple[str, ...]] = {
    "Feijão": ("Feijão", "Feijão 2ª Safra"),
    "Feijão-caupi": ("Feijão Caupi",),
    "Milho": ("Milho 1ª Safra", "Milho 2ª Safra"),
    "Soja": ("Soja",),
    "Sorgo": (
        "Sorgo Granífero", "Sorgo Granífero 2ª Safra", "Sorgo Forrageiro", "Sorgo Forrageiro 2ª Safra",
    ),
    "Arroz": ("Arroz",),
    "Algodão": ("Algodão Herbáceo",),
    "Amendoim": ("Amendoim",),
    "Girassol": ("Girassol",),
    "Mamona": ("Mamona",),
    "Trigo": ("Trigo",),
}

MANEJOS = {WaterRegime.RAINFED: ("1",), WaterRegime.IRRIGATED: ("2", "3")}
SOLOS_POR_TEXTURA = frozenset({"1", "2", "3"})

SeasonStatus = Literal["eligible", "excluded", "inconclusive", "no_coverage"]
SeasonReason = Literal[
    "indicated",
    "out_of_window",
    "depends_on_soil_or_cycle",
    "missing_source_value",
    "crop_not_zoned",
    "regime_not_zoned",
    "municipality_not_zoned",
    "same_crop_in_sequence",
]


class Linha(NamedTuple):
    cultura: str
    manejo: str
    ciclo: str
    solo: str
    portaria: str
    decendios: str


class Municipio(NamedTuple):
    geocodigo: str
    nome: str
    linhas: tuple[Linha, ...]


def _chave(texto: str) -> str:
    sem_acento = "".join(
        letra for letra in unicodedata.normalize("NFD", texto) if unicodedata.category(letra) != "Mn"
    )
    return re.sub(r"[^a-z0-9]+", " ", sem_acento.casefold()).strip()


_CULTURA_POR_CHAVE = {_chave(nome): nome for nome in CULTURAS}
_CULTURA_POR_CHAVE.update({_chave("Feijão caupi"): "Feijão-caupi", _chave("Feijao de corda"): "Feijão-caupi"})


@lru_cache(maxsize=1)
def procedencia() -> dict:
    return json.loads((PASTA / "procedencia.json").read_text(encoding="utf-8"))


@lru_cache(maxsize=None)
def _carregar_uf(uf: str) -> tuple[dict[str, Municipio], dict[str, str]]:
    """Devolve os municípios da UF por geocódigo e o índice nome -> geocódigo."""
    caminho = PASTA / f"{uf}.csv.gz"
    if not caminho.is_file():
        return {}, {}
    agrupado: dict[str, list[Linha]] = {}
    nomes: dict[str, str] = {}
    with gzip.open(caminho, "rt", encoding="utf-8", newline="") as arquivo:
        for registro in csv.DictReader(arquivo, delimiter=";"):
            geocodigo = registro["geocodigo"]
            nomes.setdefault(geocodigo, registro["municipio"])
            agrupado.setdefault(geocodigo, []).append(Linha(
                registro["cultura"], registro["manejo"], registro["ciclo"],
                registro["solo"], registro["portaria"], registro["decendios"],
            ))
    municipios = {
        geocodigo: Municipio(geocodigo, nomes[geocodigo], tuple(linhas))
        for geocodigo, linhas in agrupado.items()
    }
    return municipios, {_chave(nome): geocodigo for geocodigo, nome in nomes.items()}


def localizar_municipio(uf: str | None, nome: str | None, geocodigo: str | None) -> Municipio | None:
    """Acha o município na tábua pelo geocódigo do IBGE ou por UF e nome."""
    if not uf or uf.upper() not in UFS:
        return None
    municipios, por_nome = _carregar_uf(uf.upper())
    if geocodigo and geocodigo in municipios:
        return municipios[geocodigo]
    if nome:
        achado = por_nome.get(_chave(nome))
        if achado:
            return municipios[achado]
    return None


class SeasonInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    crop: str = Field(min_length=2, max_length=120)
    # Decêndio de plantio: 1 = 1 a 10 de janeiro ... 36 = 21 a 31 de dezembro.
    planting_decendio: int = Field(ge=1, le=36)


class ZarcInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    uf: str | None = Field(default=None, max_length=2)
    municipality: str | None = Field(default=None, max_length=120)
    ibge_code: str | None = Field(default=None, pattern=r"^\d{7}$")
    water_regime: WaterRegime
    # Textura informada pelo agricultor: 1 arenoso, 2 médio, 3 argiloso; None = não sabe.
    soil_texture: Literal[1, 2, 3] | None = None
    seasons: list[SeasonInput] = Field(min_length=1, max_length=6)


class SeasonResult(BaseModel):
    crop: str
    planting_decendio: int
    status: SeasonStatus
    reason: SeasonReason
    zarc_crop: str | None = None
    risk_min: int | None = None
    risk_max: int | None = None
    # Decêndios indicados para todos os solos e ciclos avaliados, e para pelo menos um.
    indicated_always: list[int] = Field(default_factory=list)
    indicated_sometimes: list[int] = Field(default_factory=list)
    depends_on: list[Literal["soil", "cycle"]] = Field(default_factory=list)
    ordinances: list[str] = Field(default_factory=list)


class ZarcSource(BaseModel):
    name: str
    crop_year: str
    url: str
    downloaded_on: str


class ZarcResult(BaseModel):
    status: SeasonStatus
    municipality: str | None
    ibge_code: str | None
    uf: str | None
    seasons: list[SeasonResult]
    source: ZarcSource
    soil_used: bool
    notes: list[str]


class CropWindow(BaseModel):
    crop: str
    # Decêndios indicados em todos os solos e ciclos do município, e em pelo menos um.
    indicated_always: list[int]
    indicated_sometimes: list[int]
    # Decêndios com o menor risco (20%) em todos os solos e ciclos de alguma variante da cultura.
    lowest_risk: list[int] = Field(default_factory=list)
    regime_zoned: bool


class CoverageResult(BaseModel):
    covered: bool
    municipality: str | None
    ibge_code: str | None
    crops: list[str]
    windows: list[CropWindow] = Field(default_factory=list)
    source: ZarcSource


def _fonte() -> ZarcSource:
    dados = procedencia()
    return ZarcSource(
        name=dados["fonte"], crop_year=dados["safra"], url=dados["url"],
        downloaded_on=dados["data_download"],
    )


def _risco(codigo: str) -> int:
    return int(codigo) * 10


def _formatar_portaria(bruta: str) -> str:
    """'Port.372_de_26-06-2025' -> 'Portaria nº 372, de 26/06/2025'."""
    achado = re.fullmatch(r"Port\.(\d+)_de_(\d{2})-(\d{2})-(\d{4})", bruta)
    if not achado:
        return bruta
    numero, dia, mes, ano = achado.groups()
    return f"Portaria nº {numero}, de {dia}/{mes}/{ano}"


def _avaliar_variante(linhas: list[Linha], decendio: int) -> dict:
    valores = [linha.decendios[decendio - 1] for linha in linhas]
    sempre = [
        numero for numero in range(1, 37)
        if all(linha.decendios[numero - 1] in "234" for linha in linhas)
    ]
    as_vezes = [
        numero for numero in range(1, 37)
        if any(linha.decendios[numero - 1] in "234" for linha in linhas)
    ]
    indicados = [valor for valor in valores if valor in "234"]
    depende: list[str] = []
    if indicados and len(indicados) < len(valores):
        por_solo: dict[str, set[bool]] = {}
        por_ciclo: dict[str, set[bool]] = {}
        for linha, valor in zip(linhas, valores, strict=True):
            por_solo.setdefault(linha.solo, set()).add(valor in "234")
            por_ciclo.setdefault(linha.ciclo, set()).add(valor in "234")
        # Se dentro de um mesmo solo o resultado varia, a diferença vem do ciclo, e vice-versa.
        if len({frozenset(v) for v in por_solo.values()}) > 1 or any(len(v) > 1 for v in por_ciclo.values()):
            depende.append("soil")
        if len({frozenset(v) for v in por_ciclo.values()}) > 1 or any(len(v) > 1 for v in por_solo.values()):
            depende.append("cycle")
    return {
        "valores": valores, "indicados": indicados, "sempre": sempre, "as_vezes": as_vezes,
        "depende": depende, "portarias": sorted({_formatar_portaria(linha.portaria) for linha in linhas}),
    }


def _avaliar_safra(
    municipio: Municipio | None, safra: SeasonInput, regime: WaterRegime, textura: int | None,
) -> tuple[SeasonResult, bool]:
    base = {"crop": safra.crop, "planting_decendio": safra.planting_decendio}
    if municipio is None:
        return SeasonResult(**base, status="no_coverage", reason="municipality_not_zoned"), False

    cultura = _CULTURA_POR_CHAVE.get(_chave(safra.crop))
    variantes = CULTURAS.get(cultura or "", ())
    da_cultura = [linha for linha in municipio.linhas if linha.cultura in variantes]
    if not da_cultura:
        return SeasonResult(**base, status="no_coverage", reason="crop_not_zoned"), False
    do_manejo = [linha for linha in da_cultura if linha.manejo in MANEJOS[regime]]
    if not do_manejo:
        return SeasonResult(**base, status="no_coverage", reason="regime_not_zoned"), False

    solo_usado = False
    avaliadas: list[tuple[str, dict]] = []
    for variante in variantes:
        linhas = [linha for linha in do_manejo if linha.cultura == variante]
        if not linhas:
            continue
        # A textura só filtra linhas classificadas por textura (1, 2, 3). As classes de água
        # disponível (AD1 a AD6) exigem análise de solo e não são deduzidas da textura.
        if textura is not None and all(linha.solo in SOLOS_POR_TEXTURA for linha in linhas):
            filtradas = [linha for linha in linhas if linha.solo == str(textura)]
            if filtradas:
                linhas, solo_usado = filtradas, True
        avaliadas.append((variante, _avaliar_variante(linhas, safra.planting_decendio)))

    def montar(variante: str, dados: dict, status: SeasonStatus, reason: SeasonReason) -> SeasonResult:
        riscos = [_risco(valor) for valor in dados["indicados"]]
        return SeasonResult(
            **base, status=status, reason=reason, zarc_crop=variante,
            risk_min=min(riscos) if riscos else None, risk_max=max(riscos) if riscos else None,
            indicated_always=dados["sempre"], indicated_sometimes=dados["as_vezes"],
            depends_on=dados["depende"], ordinances=dados["portarias"],
        )

    completas = [
        (variante, dados) for variante, dados in avaliadas
        if dados["indicados"] and len(dados["indicados"]) == len(dados["valores"])
    ]
    if completas:
        variante, dados = min(completas, key=lambda item: max(item[1]["indicados"]))
        return montar(variante, dados, "eligible", "indicated"), solo_usado

    if any("?" in dados["valores"] for _, dados in avaliadas):
        variante, dados = next(item for item in avaliadas if "?" in item[1]["valores"])
        return montar(variante, dados, "inconclusive", "missing_source_value"), solo_usado

    parciais = [(variante, dados) for variante, dados in avaliadas if dados["indicados"]]
    if parciais:
        variante, dados = max(parciais, key=lambda item: len(item[1]["indicados"]))
        return montar(variante, dados, "inconclusive", "depends_on_soil_or_cycle"), solo_usado

    # Fora da janela em todas as variantes: mostra a janela da variante com mais decêndios indicados.
    variante, dados = max(avaliadas, key=lambda item: len(item[1]["as_vezes"]))
    return montar(variante, dados, "excluded", "out_of_window"), solo_usado


_ORDEM: dict[SeasonStatus, int] = {"excluded": 3, "inconclusive": 2, "no_coverage": 1, "eligible": 0}


def evaluate(payload: ZarcInput) -> ZarcResult:
    """Avalia cada safra pela tábua e devolve o pior estado como estado da rotação."""
    municipio = localizar_municipio(payload.uf, payload.municipality, payload.ibge_code)
    resultados: list[SeasonResult] = []
    solo_usado = False
    for safra in payload.seasons:
        resultado, usou = _avaliar_safra(municipio, safra, payload.water_regime, payload.soil_texture)
        solo_usado = solo_usado or usou
        resultados.append(resultado)

    # Regra estrutural da UC-11: a mesma cultura em safras seguidas não é rotação.
    for anterior, atual in zip(resultados, resultados[1:]):
        if _chave(anterior.crop) == _chave(atual.crop):
            atual.status, atual.reason = "excluded", "same_crop_in_sequence"

    notas = [
        "Risco climático do ZARC é a chance de perda por clima na época de plantio; não é nota da rotação.",
        "O ZARC avalia cada safra separadamente; não confere se a segunda cabe depois da colheita da primeira.",
        "Resultado exploratório, sem revisão agronômica. Não é recomendação de plantio.",
    ]
    return ZarcResult(
        status=max((item.status for item in resultados), key=_ORDEM.__getitem__),
        municipality=municipio.nome if municipio else None,
        ibge_code=municipio.geocodigo if municipio else None,
        uf=payload.uf.upper() if payload.uf and payload.uf.upper() in UFS else None,
        seasons=resultados, source=_fonte(), soil_used=solo_usado, notes=notas,
    )


class CoverageInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    uf: str | None = Field(default=None, max_length=2)
    municipality: str | None = Field(default=None, max_length=120)
    ibge_code: str | None = Field(default=None, pattern=r"^\d{7}$")
    water_regime: WaterRegime = WaterRegime.RAINFED
    soil_texture: Literal[1, 2, 3] | None = None


def coverage(payload: CoverageInput) -> CoverageResult:
    """Diz se o município está na tábua e quais culturas do aplicativo ela cobre ali."""
    municipio = localizar_municipio(payload.uf, payload.municipality, payload.ibge_code)
    if municipio is None:
        return CoverageResult(covered=False, municipality=None, ibge_code=None, crops=[], source=_fonte())
    presentes = {linha.cultura for linha in municipio.linhas}
    culturas = [nome for nome, variantes in CULTURAS.items() if presentes.intersection(variantes)]
    janelas = []
    for cultura in culturas:
        do_manejo = [
            linha for linha in municipio.linhas
            if linha.cultura in CULTURAS[cultura] and linha.manejo in MANEJOS[payload.water_regime]
        ]
        sempre: set[int] = set()
        as_vezes: set[int] = set()
        menor: set[int] = set()
        for variante in CULTURAS[cultura]:
            linhas = [linha for linha in do_manejo if linha.cultura == variante]
            if not linhas:
                continue
            if payload.soil_texture is not None and all(linha.solo in SOLOS_POR_TEXTURA for linha in linhas):
                filtradas = [linha for linha in linhas if linha.solo == str(payload.soil_texture)]
                linhas = filtradas or linhas
            dados = _avaliar_variante(linhas, 1)
            sempre.update(dados["sempre"])
            as_vezes.update(dados["as_vezes"])
            menor.update(n for n in range(1, 37) if all(linha.decendios[n - 1] == "2" for linha in linhas))
        janelas.append(CropWindow(
            crop=cultura, indicated_always=sorted(sempre), indicated_sometimes=sorted(as_vezes),
            lowest_risk=sorted(menor), regime_zoned=bool(do_manejo),
        ))
    return CoverageResult(
        covered=True, municipality=municipio.nome, ibge_code=municipio.geocodigo,
        crops=culturas, windows=janelas, source=_fonte(),
    )
