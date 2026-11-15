# ADR-0007: Histórico cronológico de cultivo

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-05 e [ADR-0002](0002-unidade-e-casos-da-poc.md)

## Contexto

A UC-05 exige registrar culturas recentes da mesma área, preservando a sequência e o período. Exigir dias exatos pode sugerir precisão que o agricultor não possui. O histórico precisa aceitar mais de duas etapas para representar estudos de rotação mais longos.

## Decisão

- Cada etapa guarda nome da cultura, mês inicial e mês final no formato `AAAA-MM`.
- A ordem do vetor de etapas é a ordem do histórico, da mais antiga para a mais recente. A API valida essa ordem e devolve o vetor sem reordenar.
- O mês final não pode anteceder o inicial. Etapas com o mesmo mês inicial e períodos sobrepostos são aceitas para não descartar consórcios ou transições sem uma regra agronômica definida.
- O nome da cultura é texto informado pelo agricultor. Normalização taxonômica e elegibilidade de culturas pertencem a cards posteriores.
- A PoC aceita de 1 a 20 etapas. A resposta validada fica como rascunho local até existir a persistência da área da UC-02.

## Consequências

- A interface mostra a sequência numerada com cultura e período após validação.
- A validação cronológica não conclui adequação da rotação nem resolve sobreposições agronômicas.
- Ao conectar a UC-02, o histórico deverá ser vinculado à área de cultivo correspondente, sem misturar registros de áreas diferentes.
