"""UC-05: ordered cultivation history for one cultivation area."""

from pydantic import BaseModel, ConfigDict, Field, model_validator


MONTH_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"


class CultivationPeriod(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    crop: str = Field(min_length=2, max_length=120)
    start_month: str = Field(pattern=MONTH_PATTERN)
    end_month: str = Field(pattern=MONTH_PATTERN)

    @model_validator(mode="after")
    def validate_period(self) -> "CultivationPeriod":
        if self.end_month < self.start_month:
            raise ValueError("End month cannot precede start month")
        return self


class CultivationHistoryInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    periods: list[CultivationPeriod] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def validate_order(self) -> "CultivationHistoryInput":
        starts = [period.start_month for period in self.periods]
        if starts != sorted(starts):
            raise ValueError("Periods must be entered in chronological order")
        return self


class CultivationHistoryValidation(BaseModel):
    history: CultivationHistoryInput


def validate_cultivation_history(
    history: CultivationHistoryInput,
) -> CultivationHistoryValidation:
    """Return the user's sequence unchanged, including each crop and period."""
    return CultivationHistoryValidation(history=history)
