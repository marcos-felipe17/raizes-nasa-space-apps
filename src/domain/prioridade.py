from enum import Enum
from pydantic import BaseModel
from typing import Dict, Optional


class TipoPrioridade(str, Enum):
    SAUDE_SOLO = "saude_solo"
    CONSERVACAO_AGUA = "conservacao_agua"
    PRODUTIVIDADE_GRAOS = "produtividade_graos"
    RENDA_ECONOMICA = "renda_economica"


class ResultadoPrioridade(BaseModel):
    prioridade_codigo: TipoPrioridade
    prioridade_rotulo: str
    origem: str = "informado_pelo_agricultor"
    pontuavel_na_poc: bool
    pesos_explicitos: Dict[str, float]
    aviso_limite: Optional[str] = None


def avaliar_prioridade(prioridade: TipoPrioridade) -> ResultadoPrioridade:
    """
    Aplica as regras de domínio da UC-07 e ADR-0003:
    - Define pesos explícitos e auditáveis.
    - Aplica a RN-08 caso a prioridade seja econômica.
    """
    configuracoes = {
        TipoPrioridade.SAUDE_SOLO: {
            "rotulo": "Saúde do Solo e Cobertura (Palhada)",
            "pontuavel": True,
            "pesos": {"cobertura_palhada": 0.5, "diversidade_botanica": 0.3, "estabilidade_hidrica": 0.2},
            "aviso": None,
        },
        TipoPrioridade.CONSERVACAO_AGUA: {
            "rotulo": "Resiliência e Conservação Hídrica",
            "pontuavel": True,
            "pesos": {"estabilidade_hidrica": 0.6, "cobertura_palhada": 0.3, "diversidade_botanica": 0.1},
            "aviso": None,
        },
        TipoPrioridade.PRODUTIVIDADE_GRAOS: {
            "rotulo": "Produção de Grãos e Segurança Alimentar",
            "pontuavel": True,
            "pesos": {"adequacao_climatica": 0.5, "estabilidade_hidrica": 0.3, "cobertura_palhada": 0.2},
            "aviso": None,
        },
        TipoPrioridade.RENDA_ECONOMICA: {
            "rotulo": "Renda / Retorno Econômico",
            "pontuavel": False,
            "pesos": {},
            "aviso": (
                ##RN-08: Prioridade econômica registrada no perfil, mas não será pontuada 
                ##no protótipo devido à ausência de séries locais confiáveis de preços e custos.
            ),
        },
    }

    cfg = configuracoes[prioridade]
    return ResultadoPrioridade(
        prioridade_codigo=prioridade,
        prioridade_rotulo=cfg["rotulo"],
        pontuavel_na_poc=cfg["pontuavel"],
        pesos_explicitos=cfg["pesos"],
        aviso_limite=cfg["aviso"],
    )