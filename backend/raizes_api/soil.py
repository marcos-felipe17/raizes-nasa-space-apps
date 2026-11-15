"""Contrato da UC-03: descrição e procedência do solo da área."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SoilStatus(StrEnum):
    KNOWN = "known"
    UNKNOWN = "unknown"


class SoilSource(StrEnum):
    FARMER = "farmer"
    EXTERNAL = "external"


class SoilInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    status: SoilStatus
    description: str | None = Field(default=None, min_length=2, max_length=500)
    classification: str | None = Field(default=None, min_length=2, max_length=120)
    source: SoilSource | None = None
    source_reference: str | None = Field(default=None, min_length=2, max_length=300)

    @model_validator(mode="after")
    def validate_consistency(self) -> "SoilInput":
        if self.status == SoilStatus.UNKNOWN:
            if any((self.description, self.classification, self.source, self.source_reference)):
                raise ValueError("Unknown soil cannot contain properties or provenance")
            return self

        if not (self.description or self.classification):
            raise ValueError("Known soil requires a description or classification")
        if self.source is None:
            raise ValueError("Known soil requires a source")
        if self.source == SoilSource.EXTERNAL and not self.source_reference:
            raise ValueError("External soil data requires a source reference")
        if self.source == SoilSource.FARMER and self.source_reference:
            raise ValueError("Farmer-supplied soil data cannot have an external reference")
        return self


class SoilValidation(BaseModel):
    soil: SoilInput
    missing_for_analysis: list[str]


def validate_soil(value: SoilInput) -> SoilValidation:
    missing = ["soil"] if value.status == SoilStatus.UNKNOWN else []
    return SoilValidation(soil=value, missing_for_analysis=missing)
