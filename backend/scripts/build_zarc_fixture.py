"""Gera o recorte versionado da Tábua de Risco do ZARC (dados abertos do MAPA).

Lê o CSV oficial de uma safra e grava um arquivo compactado por UF, mantendo os
valores de risco de cada decêndio exatamente como publicados. Não altera, não
interpola e não completa nenhum valor.

Uso (a partir de backend/):
    python scripts/build_zarc_fixture.py CAMINHO_DO_CSV --safra 2025-2026 \
        --url URL_DE_ORIGEM --modificado "data do cabeçalho Last-Modified"
"""

from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
from collections import defaultdict
from datetime import date
from pathlib import Path

SAIDA = Path(__file__).resolve().parents[2] / "data" / "fixtures" / "zarc"
COLUNAS = (
    "geocodigo", "municipio", "cultura", "manejo", "clima", "ciclo", "solo", "portaria", "decendios",
)
# Valor vazio existe em poucas linhas da fonte; é preservado como "?" (dado ausente), nunca como 0.
CODIGO_RISCO = {"0": "0", "20": "2", "30": "3", "40": "4", "": "?"}


def _sha256(caminho: Path) -> str:
    resumo = hashlib.sha256()
    with caminho.open("rb") as arquivo:
        for bloco in iter(lambda: arquivo.read(1 << 20), b""):
            resumo.update(bloco)
    return resumo.hexdigest()


def gerar(origem: Path, safra: str, url: str, modificado: str) -> dict:
    por_uf: dict[str, list[tuple[str, ...]]] = defaultdict(list)
    culturas: set[str] = set()
    total = 0
    vazios = 0
    with origem.open(encoding="utf-8-sig", newline="") as arquivo:
        for linha in csv.DictReader(arquivo, delimiter=";"):
            riscos = [linha[f"dec{numero}"] for numero in range(1, 37)]
            if any(risco not in CODIGO_RISCO for risco in riscos):
                raise ValueError(f"risco inesperado na linha {total + 2}: {riscos}")
            # Um caractere por decêndio: 0 (não indicado), 2, 3 ou 4 (risco de 20, 30 ou 40%).
            decendios = "".join(CODIGO_RISCO[risco] for risco in riscos)
            vazios += decendios.count("?")
            por_uf[linha["UF"]].append((
                linha["geocodigo"], linha["municipio"], linha["Nome_cultura"],
                linha["Cod_Outros_Manejos"], linha["Cod_Clima"], linha["Cod_Ciclo"],
                linha["Cod_Solo"], linha["Portaria"], decendios,
            ))
            culturas.add(linha["Nome_cultura"])
            total += 1

    destino = SAIDA / safra
    destino.mkdir(parents=True, exist_ok=True)
    for uf, linhas in sorted(por_uf.items()):
        linhas.sort()
        with gzip.GzipFile(destino / f"{uf}.csv.gz", "wb", mtime=0) as bruto:
            texto = ";".join(COLUNAS) + "\n" + "".join(";".join(linha) + "\n" for linha in linhas)
            bruto.write(texto.encode("utf-8"))

    metadados = {
        "fonte": "MAPA, Zoneamento Agrícola de Risco Climático (Zarc) - Tábua de Risco, dados abertos",
        "safra": safra.replace("-", "/"),
        "url": url,
        "arquivo_origem_modificado_em": modificado,
        "arquivo_origem_sha256": _sha256(origem),
        "data_download": date.today().isoformat(),
        "linhas": total,
        "decendios_vazios_na_fonte": vazios,
        "linhas_por_uf": {uf: len(linhas) for uf, linhas in sorted(por_uf.items())},
        "culturas": sorted(culturas),
        "colunas": list(COLUNAS),
        "codigos": {
            "decendios": "36 caracteres, um por decêndio do ano: 0 = não indicado; 2, 3, 4 = risco de 20, 30 ou 40%; ? = vazio na fonte",
            "manejo": {"1": "Sequeiro", "2": "Irrigado", "3": "Irrigado com controle de geada"},
            "ciclo": {"20": "Grupo I", "21": "Grupo II", "22": "Grupo III", "24": "Grupo IV"},
            "solo": {"1": "Arenoso", "2": "Textura média", "3": "Argiloso", "11": "AD1", "12": "AD2",
                     "13": "AD3", "14": "AD4", "15": "AD5", "16": "AD6"},
            "clima": {"0": "Não se aplica", "4": "Semiárido"},
        },
        "nota": "Recorte sem alteração de valores. Gerado por backend/scripts/build_zarc_fixture.py.",
    }
    (destino / "procedencia.json").write_text(
        json.dumps(metadados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8",
    )
    return metadados


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("origem", type=Path)
    parser.add_argument("--safra", required=True)
    parser.add_argument("--url", required=True)
    parser.add_argument("--modificado", required=True)
    argumentos = parser.parse_args()
    metadados = gerar(argumentos.origem, argumentos.safra, argumentos.url, argumentos.modificado)
    print(f"{metadados['linhas']} linhas em {len(metadados['linhas_por_uf'])} UFs")


if __name__ == "__main__":
    main()
