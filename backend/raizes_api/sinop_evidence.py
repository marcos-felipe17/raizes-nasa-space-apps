"""Read-only, source-linked evidence for the Sinop experiment."""

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


ROOT = Path(__file__).resolve().parents[2]
EXPERIMENT_PATH = ROOT / "data/fixtures/sinop/embrapa_rotations_2014_2016.json"
POWER_PATH = ROOT / "data/fixtures/nasa_power/sinop-mt-20140101-20241231.json"


class PublishedSource(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    authors: str
    publisher: str
    publication_year: int
    url: str = Field(pattern=r"^https://")
    printed_pages: list[int]
    tables: list[int]


class PublishedRule(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    type: Literal["management_principle", "observed_sequence"]
    statement: str
    source_printed_page: int
    scope: str
    machine_checkable_with_current_inputs: Literal[False] = False


class PublishedMeasurement(BaseModel):
    model_config = ConfigDict(extra="forbid")
    harvest_year: Literal[2014, 2016]
    source_table: Literal[2, 4]
    maize_grain_kg_ha: int | None
    second_season_straw_kg_ha: int
    two_season_straw_kg_ha: int
    soy_grain_kg_ha: int | None
    soy_grain_source_table: Literal[3] | None = None


class PublishedTreatment(BaseModel):
    model_config = ConfigDict(extra="forbid")
    treatment_id: str
    sequence_reported: list[str] = Field(min_length=2, max_length=2)
    second_crop_management: str
    measurements: list[PublishedMeasurement] = Field(min_length=2, max_length=2)

    @model_validator(mode="after")
    def check_years(self):
        if {row.harvest_year for row in self.measurements} != {2014, 2016}:
            raise ValueError("Each treatment needs source observations for both years")
        return self


class SinopExperiment(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    kind: Literal["published_experiment_observations"]
    site: str
    soil_reported: str
    management_reported: str
    plot_area_m2: int
    sample_area_m2: int
    samples_per_plot: int
    source: PublishedSource
    rules_from_source: list[PublishedRule]
    observations: list[PublishedTreatment]
    missing_for_field_recommendation: list[str]
    verified_for_generation: Literal[False] = False
    note: str


class PowerCoverage(BaseModel):
    source: str
    latitude: float
    longitude: float
    period_start: str
    period_end: str
    downloaded_on: str
    api_version: str | None
    units: dict[str, str]
    valid_days: dict[str, int]
    missing_days: dict[str, int]
    role: Literal["environmental_context_only"] = "environmental_context_only"


class SinopEvidenceResult(BaseModel):
    experiment: SinopExperiment
    nasa_power: PowerCoverage
    region_verified_for_generation: Literal[False] = False


def get_sinop_evidence() -> SinopEvidenceResult:
    experiment = SinopExperiment.model_validate(json.loads(EXPERIMENT_PATH.read_text(encoding="utf-8")))
    power = json.loads(POWER_PATH.read_text(encoding="utf-8"))
    fill = power["fill_value"]
    series = power["diario"]
    counts = {
        key: (
            sum(isinstance(value, (int, float)) and value != fill for value in values.values()),
            sum(not isinstance(value, (int, float)) or value == fill for value in values.values()),
        )
        for key, values in series.items() if key in ("T2M", "PRECTOTCORR")
    }
    if set(counts) != {"T2M", "PRECTOTCORR"}:
        raise ValueError("Sinop POWER fixture is incomplete")
    climate = PowerCoverage(
        source=power["fonte"],
        latitude=power["coordenadas"]["lat"],
        longitude=power["coordenadas"]["lon"],
        period_start=power["periodo"]["inicio"],
        period_end=power["periodo"]["fim"],
        downloaded_on=power["data_download"],
        api_version=power["versao_api"],
        units=power["unidades"],
        valid_days={key: valid for key, (valid, _) in counts.items()},
        missing_days={key: missing for key, (_, missing) in counts.items()},
    )
    return SinopEvidenceResult(experiment=experiment, nasa_power=climate)
