"""Perfil mínimo da área de cultivo usado na validação das UC-03 e UC-04."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict

from .soil import SoilInput, validate_soil


class WaterRegime(StrEnum):
    RAINFED = "rainfed"
    IRRIGATED = "irrigated"


class AreaProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    soil: SoilInput
    water_regime: WaterRegime


class AreaProfileValidation(BaseModel):
    profile: AreaProfileInput
    missing_for_analysis: list[str]


def validate_area_profile(profile: AreaProfileInput) -> AreaProfileValidation:
    """Keep the explicit regime in the profile and surface known data gaps."""
    return AreaProfileValidation(
        profile=profile,
        missing_for_analysis=validate_soil(profile.soil).missing_for_analysis,
    )
