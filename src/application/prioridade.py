from pydantic import BaseModel, Field
from typing import Optional
from src.domain.prioridade import TipoPrioridade, ResultadoPrioridade, avaliar_prioridade


class PrioridadeInput(BaseModel):
    parcela_id: Optional[str] = Field(
        default="parcela-padrao",
        description="Identificador da parcela ou área de cultivo (ADR-0002)"
    )
    prioridade: TipoPrioridade = Field(
        ...,
        description="Objetivo principal escolhido pelo agricultor"
    )


class PrioridadeOutput(BaseModel):
    parcela_id: str
    resultado: ResultadoPrioridade
    mensagem_explicativa: str


def processar_prioridade(dados: PrioridadeInput) -> PrioridadeOutput:
    resultado = avaliar_prioridade(dados.prioridade)

    if resultado.pontuavel_na_poc:
        msg = (
            f"Prioridade '{resultado.prioridade_rotulo}' registrada com sucesso. "
            f"Os critérios serão ponderados explicitamente na comparação de alternativas."
        )
    else:
        msg = (
            f"Prioridade '{resultado.prioridade_rotulo}' registrada. "
            f"Atenção: o cálculo financeiro está indisponível nesta versão da PoC."
        )

    return PrioridadeOutput(
        parcela_id=dados.parcela_id or "parcela-padrao",
        resultado=resultado,
        mensagem_explicativa=msg,
    )