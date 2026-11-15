"""UC-02: localização da área, com contexto climático da NASA POWER.

Os dados climáticos são contexto. Eles não alteram o resultado de nenhuma
regra agronômica, e a resposta carrega essa informação explicitamente.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable, Literal

from pydantic import BaseModel, ConfigDict, Field

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
POWER_CLIMATOLOGY_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
USER_AGENT = "RaizesSpaceApps-Prototype/0.1"
TIMEOUT_S = 10
POWER_FILL_VALUE = -999

NASA_NOTE = (
    "Dados climáticos da NASA POWER são contexto e não alteram o resultado "
    "de nenhuma regra agronômica."
)

GetJson = Callable[[str], Any]


class LocationInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    place: str = Field(min_length=2, max_length=200)


class Coordinates(BaseModel):
    lat: float
    lon: float
    display_name: str


class ClimateContext(BaseModel):
    status: Literal["ok", "unavailable"]
    # Chaves JAN..DEC e ANN, em °C (T2M) e mm/dia (PRECTOTCORR, climatologia).
    temperature_2m_c: dict[str, float | None] | None = None
    precipitation_mm_dia: dict[str, float | None] | None = None
    reason: str | None = None
    provenance: str


class LocationResult(BaseModel):
    place: str
    coordinates: Coordinates
    climate: ClimateContext
    geocoding_provenance: str
    note: str = NASA_NOTE


class LocationNotFound(Exception):
    """Nenhum resultado para o nome informado."""


class UpstreamError(Exception):
    """Falha ao consultar o serviço de geocodificação."""


def _get_json(url: str) -> Any:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_S) as response:
        return json.loads(response.read().decode("utf-8"))


# OSError cobre URLError, HTTPError, timeout e queda de conexão; ValueError cobre JSON inválido.
_NETWORK_ERRORS = (OSError, ValueError)
_SHAPE_ERRORS = (KeyError, IndexError, TypeError, ValueError, AttributeError)


def geocode(place: str, get_json: GetJson = _get_json) -> Coordinates:
    query = urllib.parse.urlencode({"q": place, "format": "json", "limit": 1})
    try:
        hits = get_json(f"{NOMINATIM_URL}?{query}")
    except _NETWORK_ERRORS as exc:
        raise UpstreamError("geocodificação indisponível") from exc

    if not hits:
        raise LocationNotFound(place)

    try:
        hit = hits[0]
        return Coordinates(
            lat=float(hit["lat"]),
            lon=float(hit["lon"]),
            display_name=str(hit["display_name"]),
        )
    except _SHAPE_ERRORS as exc:
        raise UpstreamError("resposta inesperada da geocodificação") from exc


def _clean_series(series: dict[str, Any]) -> dict[str, float | None]:
    return {
        key: None if value == POWER_FILL_VALUE else float(value)
        for key, value in series.items()
    }


def climate_for(coords: Coordinates, get_json: GetJson = _get_json) -> ClimateContext:
    provenance = "NASA POWER, climatologia (comunidade AG)"
    query = urllib.parse.urlencode(
        {
            "parameters": "T2M,PRECTOTCORR",
            "community": "AG",
            "latitude": coords.lat,
            "longitude": coords.lon,
            "format": "JSON",
        }
    )
    try:
        data = get_json(f"{POWER_CLIMATOLOGY_URL}?{query}")
    except _NETWORK_ERRORS:
        return ClimateContext(
            status="unavailable",
            reason="API da NASA POWER indisponível no momento",
            provenance=provenance,
        )

    unexpected = ClimateContext(
        status="unavailable",
        reason="resposta da NASA POWER sem os parâmetros esperados",
        provenance=provenance,
    )
    try:
        parameters = (data.get("properties") or {}).get("parameter") or {}
        temperature = parameters.get("T2M")
        precipitation = parameters.get("PRECTOTCORR")
        if not temperature or not precipitation:
            return unexpected
        return ClimateContext(
            status="ok",
            temperature_2m_c=_clean_series(temperature),
            precipitation_mm_dia=_clean_series(precipitation),
            provenance=provenance,
        )
    except _SHAPE_ERRORS:
        return unexpected


def resolve_location(payload: LocationInput, get_json: GetJson = _get_json) -> LocationResult:
    coords = geocode(payload.place, get_json)
    return LocationResult(
        place=payload.place,
        coordinates=coords,
        climate=climate_for(coords, get_json),
        geocoding_provenance="OpenStreetMap Nominatim",
    )
