# ADR-0015: Prioridade sem ordenação fictícia

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-17, [ADR-0003](0003-metodo-de-analise-e-confiabilidade.md), [ADR-0014](0014-comparacao-descritiva-sem-ranking.md)

## Contexto

A UC-17 permite mudar a prioridade e exige explicar quais critérios alteraram a ordem. A UC-07 ainda não registra prioridades no produto; a UC-13 não calcula indicadores auditados. Na UC-16, as opções estão lado a lado, mas a ordem é de apresentação, não um ranking. Ordená-las por diversidade ou procedência como se isso representasse saúde do solo, água, clima ou renda seria um substituto indevido.

## Decisão

- A interface permite escolher entre saúde do solo, conservação de água, resiliência climática e renda, guardando a escolha em um rascunho local. O backend recebe a prioridade explicitamente e recompõe a comparação a partir das entradas; não recebe scores nem alternativas do cliente.
- Enquanto não existirem indicadores auditados, o retorno marca `ranking_status=unavailable`, `order_changed=null` e `criteria_used_for_ranking=[]`. Explica que nenhum critério alterou a ordem, pois não há base para ordenar. A proposta permanece primeiro apenas para leitura.
- Renda também exige preços e custos locais; sem eles, essa dimensão é indisponível, conforme RN-08 da elicitação.
- A escolha local antecipa o fluxo da UC-07, mas não substitui o contrato completo dessa card.

## Consequências

- O usuário consegue alterar a prioridade e observar, de modo honesto, por que a classificação não muda nesta fase.
- A UC-17 só estará completa após a UC-07 estabelecer o perfil de prioridade e a UC-13 fornecer indicadores comparáveis, método de ponderação, limites e testes de sensibilidade. A integração deverá explicar quais critérios realmente causaram cada mudança de ordem.
- Este PR parte da branch da UC-16 para manter o diff isolado enquanto os PRs dependentes estão abertos.
