"""Baixa a série diária da NASA POWER para um ponto e salva com metadados.

Uso (a partir de backend/):
    python scripts/fetch_power.py --name sinop-mt --lat -11.8609 --lon -55.5053 \
        --start 20140101 --end 20241231

Os dados são CONTEXTO ambiental. A demo lê o arquivo salvo e não a API ao vivo.
Os valores são gravados sem alteração; o fill value (-999) é mantido e documentado.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

POWER_DAILY_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = ("PRECTOTCORR", "T2M")
COMMUNITY = "AG"
USER_AGENT = "RaizesSpaceApps-Prototype/0.1"
TIMEOUT_S = 60
DEFAULT_OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "fixtures" / "nasa_power"

Fetcher = Callable[[str], dict[str, Any]]


def build_url(lat: float, lon: float, start: str, end: str) -> str:
    query = urllib.parse.urlencode(
        {
            "parameters": ",".join(PARAMETERS),
            "community": COMMUNITY,
            "latitude": lat,
            "longitude": lon,
            "start": start,
            "end": end,
            "format": "JSON",
        }
    )
    return f"{POWER_DAILY_URL}?{query}"


def _default_fetch(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
        return json.loads(response.read().decode("utf-8"))


def _validate_dates(start: str, end: str) -> None:
    fmt = "%Y%m%d"
    s = dt.datetime.strptime(start, fmt)
    e = dt.datetime.strptime(end, fmt)
    if s > e:
        raise ValueError("início posterior ao fim")


def build_document(
    name: str, lat: float, lon: float, start: str, end: str, fetch: Fetcher = _default_fetch
) -> dict[str, Any]:
    _validate_dates(start, end)
    url = build_url(lat, lon, start, end)
    raw = fetch(url)

    parameter = raw.get("properties", {}).get("parameter")
    if not parameter or any(p not in parameter for p in PARAMETERS):
        raise ValueError("resposta da NASA POWER sem os parâmetros esperados")

    units = {p: raw.get("parameters", {}).get(p, {}).get("units") for p in PARAMETERS}
    return {
        "local": name,
        "coordenadas": {"lat": lat, "lon": lon},
        "fonte": "NASA POWER, API diária por ponto",
        "comunidade": COMMUNITY,
        "parametros": list(PARAMETERS),
        "unidades": units,
        "periodo": {"inicio": start, "fim": end},
        "fill_value": raw.get("header", {}).get("fill_value", -999),
        "url_requisicao": url,
        "data_download": dt.date.today().isoformat(),
        "versao_api": raw.get("header", {}).get("api", {}).get("version"),
        "nota": "Contexto ambiental. Não altera o resultado de nenhuma regra agronômica.",
        "diario": parameter,
    }


def output_path(out_dir: Path, name: str, start: str, end: str) -> Path:
    return out_dir / f"{name}-{start}-{end}.json"


def save(document: dict[str, Any], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def fetch_cached(
    name: str,
    lat: float,
    lon: float,
    start: str,
    end: str,
    out_dir: Path,
    fetch: Fetcher = _default_fetch,
) -> tuple[Path, bool]:
    """Devolve (arquivo, baixou). Não chama a API se o arquivo já existe."""
    path = output_path(out_dir, name, start, end)
    if path.exists():
        return path, False
    return save(build_document(name, lat, lon, start, end, fetch), path), True


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--name", required=True, help="identificador do local, ex.: sinop-mt")
    parser.add_argument("--lat", type=float, required=True)
    parser.add_argument("--lon", type=float, required=True)
    parser.add_argument("--start", required=True, help="AAAAMMDD")
    parser.add_argument("--end", required=True, help="AAAAMMDD")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    args = parser.parse_args(argv)

    try:
        path, downloaded = fetch_cached(
            args.name, args.lat, args.lon, args.start, args.end, args.out_dir
        )
    except (ValueError, OSError) as exc:
        print(f"erro: {exc}", file=sys.stderr)
        return 1

    print(f"{path} ({'baixado' if downloaded else 'já existia, sem nova consulta'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
