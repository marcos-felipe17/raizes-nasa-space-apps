# ADR-0016: Explicação vinculada às regras verificadas

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-14, [ADR-0012](0012-restricao-estrutural-e-abstencao.md)

## Contexto

A UC-14 exige critérios, restrições e incertezas. A UC-11 implementa apenas a regra estrutural de culturas distintas. As branches das UCs 12 e 13 ainda não estão integradas a essa base; a UC-12 usa exigências regionais placeholder e a UC-13 contém notas demonstrativas e um contrato de proposta divergente. Repetir seus resultados como fatos da área produziria explicações sem base.

## Decisão

- A explicação é calculada no servidor a partir da proposta e do resultado da UC-11. O cliente não pode fornecer status, critérios ou R.
- Cada critério traz identificador, resultado, motivo, escopo e fontes. Restrições listam somente critérios violados; ausência de violação estrutural não vira aprovação local.
- Incertezas separam o limite da regra estrutural, a falta de vínculo persistente com uma área e a ausência de regras regionais auditadas. A exclusão é descrita como exclusão da rotação diversificada, não proibição de plantio.
- `indicator_r` permanece nulo. A tela mostra passos concretos para investigar ou corrigir a proposta.

## Consequências

- O fluxo já explica decisões sustentadas pela UC-11, sem inventar adequação.
- Após revisão e integração das UCs 12 e 13, o contrato deverá incorporar lacunas e indicadores auditados, com respectivas fontes, versões e limitações. Este PR não declara a UC-14 completa para a análise agronômica ampla.
- A branch parte da UC-11 para manter o diff isolado enquanto as dependências são revisadas.
