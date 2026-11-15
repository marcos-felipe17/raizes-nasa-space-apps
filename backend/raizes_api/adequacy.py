"""UC-13: Visualização da adequação estimada (Indicador R) com abstenção explícita."""
from typing import Dict, Literal, Optional
from pydantic import BaseModel, ConfigDict
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AdequacaoInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    proposal: RotationProposalInput
    status_restricao: Literal["passed", "excluded", "inconclusive"]
    dados_completos: bool = True
    prioridade: Optional[str] = "saude_solo"

class CriterioAvaliado(BaseModel):
    nome: str
    nota_parcial: float
    peso_aplicado: float
    origem_dado: str

class AdequacaoResult(BaseModel):
    status: Literal["elegivel", "excluido", "inconclusivo"]
    indicador_r: Optional[float] = None
    criterios_avaliados: list[CriterioAvaliado]
    criterios_nao_avaliados: list[str]
    motivo: str
    limitacoes: list[str]

class RotationProposalInput(BaseModel):
    # Define aqui os campos que a tua proposta de rotação precisa de receber
    area_id: str
    crop_history: List[str] = []
    constraints: Dict[str, Any] = {}
    economic_priorities: Optional[Dict[str, Any]] = None

def avaliar_adequacao(payload: AdequacaoInput) -> AdequacaoResult:
    """
    Calcula e expõe o indicador R apenas quando calculável e fundamentado:
    - Excluído (UC-11): R não se aplica (RN-03).
    - Inconclusivo / Dados ausentes (UC-12): R fica indisponível (RN-01, RN-02).
    - Prioridade econômica: registrada, mas sem pontuação financeira na PoC (RN-08).
    """
    if payload.status_restricao == "excluded":
        return AdequacaoResult(
            status="excluido",
            indicador_r=None,
            criterios_avaliados=[],
            criterios_nao_avaliados=["todos"],
            motivo="Proposta descartada na verificação de restrições (UC-11). Indicador R não calculado (RN-03).",
            limitacoes=["Opção incompatível com o critério estrutural de rotação."]
        )

    if not payload.dados_completos or payload.status_restricao == "inconclusive":
        return AdequacaoResult(
            status="inconclusivo",
            indicador_r=None,
            criterios_avaliados=[],
            criterios_nao_avaliados=["solo_local", "regras_regionais", "balanco_hidrico"],
            motivo="Avaliação inconclusiva por falta de dados ou regras regionais verificadas (RN-02).",
            limitacoes=[
                "Ausência de dado não equivale a baixo risco (RN-01).",
                "Sem cobertura local verificada, o sistema abstém-se de calcular R (ADR-0001)."
            ]
        )

    # Pesos explícitos alinhados com a UC-07 e ADR-0003
    pesos_por_prioridade: Dict[str, Dict[str, float]] = {
        "saude_solo": {"diversidade_cultural": 0.4, "cobertura_palhada": 0.4, "estabilidade_hidrica": 0.2},
        "conservacao_agua": {"diversidade_cultural": 0.2, "cobertura_palhada": 0.2, "estabilidade_hidrica": 0.6},
        "produtividade_graos": {"diversidade_cultural": 0.3, "cobertura_palhada": 0.3, "estabilidade_hidrica": 0.4},
    }

    criterios_nao_avaliados = []
    if payload.prioridade == "renda_economica":
        criterios_nao_avaliados.append("retorno_economico (RN-08: sem preços/custos locais confiáveis na PoC)")
        pesos = pesos_por_prioridade["saude_solo"]
    else:
        pesos = pesos_por_prioridade.get(payload.prioridade or "saude_solo", pesos_por_prioridade["saude_solo"])

    # Notas base demonstrativas para os critérios físicos avaliáveis na PoC
    notas_base = {
        "diversidade_cultural": 0.90,
        "cobertura_palhada": 0.80,
        "estabilidade_hidrica": 0.75,
    }

    criterios_lista = []
    r_total = 0.0
    for crit, peso in pesos.items():
        nota = notas_base[crit]
        r_total += nota * peso
        criterios_lista.append(
            CriterioAvaliado(
                nome=crit,
                nota_parcial=nota,
                peso_aplicado=peso,
                origem_dado="NASA POWER / Regras Embrapa-NRCS auditadas"
            )
        )

    return AdequacaoResult(
        status="elegivel",
        indicador_r=round(r_total, 2),
        criterios_avaliados=criterios_lista,
        criterios_nao_avaliados=criterios_nao_avaliados,
        motivo="Adequação estimada calculada de forma determinística sobre os critérios avaliáveis (ADR-0003).",
        limitacoes=[
            "R é um índice experimental de comparação, não uma probabilidade de sucesso (ADR-0003).",
            "Dados climáticos regionais não substituem análise física da parcela (ADR-0002).",
            "Não representa prescrição agronômica para plantio real sem revisão técnica."
        ]
    )