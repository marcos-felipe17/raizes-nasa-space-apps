from pydantic import BaseModel
from src.domain.prioridade import TipoPrioridade, ResultadoPrioridade, avaliar_prioridade

class PrioridadeInput(BaseModel):
    prioridade: TipoPrioridade

class PrioridadeOutput(BaseModel):
    sucesso: bool
    mensagem: str
    resultado: ResultadoPrioridade

def processar_prioridade(dados: PrioridadeInput) -> PrioridadeOutput:
    """
    Caso de uso da UC-07: Processa a definição da prioridade escolhida
    e formata a resposta para a interface.
    """
    # Executa a regra de domínio
    resultado = avaliar_prioridade(dados.prioridade)
    
    # Mensagem informativa com base na regra RN-08
    if not resultado.pontuavel_na_poc:
        mensagem = (
            f"Prioridade '{resultado.rotulo}' registrada com sucesso. "
            f"Nota (RN-08): {resultado.aviso_limite}"
        )
    else:
        mensagem = f"Prioridade '{resultado.rotulo}' definida com sucesso com pesos explícitos."

    return PrioridadeOutput(
        sucesso=True,
        mensagem=mensagem,
        resultado=resultado
    )