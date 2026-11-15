# ADR-0011: Proposta de rotação de duas safras

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-10, UC-05, UC-06, [ADR-0007](0007-historico-de-cultivo.md), [ADR-0009](0009-culturas-candidatas-sem-elegibilidade.md)

## Contexto

A UC-10 captura uma sequência proposta pelo agricultor. O histórico da UC-05 descreve o passado, e a lista da UC-06 contém culturas candidatas, sem comprovar adequação. A proposta precisa ser distinguível desses dois registros.

## Decisão

- A proposta tem exatamente duas etapas ordenadas. Cada etapa guarda cultura, mês inicial e mês final, reutilizando o formato de período da UC-05.
- A segunda etapa deve começar em mês posterior ao início da primeira. Períodos sobrepostos e cultura repetida são preservados para avaliação posterior, sem inventar uma restrição agronômica nesta card.
- Culturas da UC-06 aparecem como sugestões na interface, mas a entrada permanece livre. Divergência da lista não é tomada como elegibilidade ou proibição.
- A API devolve `analysis_performed: false`. A UC-10 não calcula restrições, R, score ou recomendação.
- A última proposta validada fica como rascunho local neste navegador. Ainda não há identificador persistente que vincule proposta, histórico, culturas e coordenadas à mesma área; essa associação é necessária antes de usar esses registros no motor.

## Consequências

- UC-11 e UC-12 poderão ler a proposta estruturada e aplicar regras ou identificar lacunas sem reinterpretar texto livre.
- O agricultor pode testar uma cultura nova ou uma sequência problemática; a interface não a apresenta como adequada.
