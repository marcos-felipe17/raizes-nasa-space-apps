from dataclasses import dataclass, field
from typing import Any, Literal, Optional


RegimeHidrico = Literal["sequeiro", "irrigado"]


def _clean_optional_text(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


@dataclass(frozen=True)
class CropHistoryItem:
    cultura: Optional[str] = None
    periodo: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "CropHistoryItem":
        return cls(
            cultura=_clean_optional_text(data.get("cultura")),
            periodo=_clean_optional_text(data.get("periodo")),
        )

    def to_dict(self) -> dict[str, Optional[str]]:
        return {
            "cultura": self.cultura,
            "periodo": self.periodo,
        }


@dataclass(frozen=True)
class Scenario:
    id: str
    nome: Optional[str]
    regiao_aproximada: Optional[str]
    solo: Optional[str]
    regime_hidrico: Optional[RegimeHidrico]
    historico: list[CropHistoryItem] = field(default_factory=list)
    culturas_possiveis: list[str] = field(default_factory=list)
    prioridade: Optional[str] = None
    simulado: bool = True

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Optional["Scenario"]:
        if data.get("simulado") is not True:
            return None

        scenario_id = _clean_optional_text(data.get("id"))
        if not scenario_id:
            return None

        raw_regime = _clean_optional_text(data.get("regime_hidrico"))
        regime: Optional[RegimeHidrico] = None
        if raw_regime in ("sequeiro", "irrigado"):
            regime = raw_regime  # type: ignore[assignment]

        raw_historico = data.get("historico") or []
        historico = [
            CropHistoryItem.from_dict(item)
            for item in raw_historico
            if isinstance(item, dict)
        ]

        raw_culturas = data.get("culturas_possiveis") or []
        culturas_possiveis = [
            cleaned
            for item in raw_culturas
            if (cleaned := _clean_optional_text(item)) is not None
        ]

        return cls(
            id=scenario_id,
            nome=_clean_optional_text(data.get("nome")),
            regiao_aproximada=_clean_optional_text(data.get("regiao_aproximada")),
            solo=_clean_optional_text(data.get("solo")),
            regime_hidrico=regime,
            historico=historico,
            culturas_possiveis=culturas_possiveis,
            prioridade=_clean_optional_text(data.get("prioridade")),
            simulado=True,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "nome": self.nome,
            "regiao_aproximada": self.regiao_aproximada,
            "solo": self.solo,
            "regime_hidrico": self.regime_hidrico,
            "historico": [item.to_dict() for item in self.historico],
            "culturas_possiveis": list(self.culturas_possiveis),
            "prioridade": self.prioridade,
            "simulado": self.simulado,
        }
