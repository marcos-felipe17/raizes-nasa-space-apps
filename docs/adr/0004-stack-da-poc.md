# ADR-0004: Stack e integração inicial da PoC

- **Status:** aceito
- **Data:** 2026-11-15
- **Complementa:** [ADR-0001](0001-arquitetura-do-raizes.md)

## Contexto

A equipe iniciou as duas primeiras user cards e definiu Next.js para a interface e FastAPI para o backend. A separação física das camadas era uma possibilidade deixada em aberto no ADR-0001. A UC-03 no Notion trata exclusivamente de informar o solo da área.

## Decisão

- Usar Next.js para a interface e FastAPI para a API e o motor de análise.
- Manter regras e contratos do motor independentes da interface. O frontend consome endpoints versionados em `/api/v1`.
- Para a UC-03, criar no backend um contrato de solo conhecido ou desconhecido, com origem do dado quando ele for conhecido.
- A primeira rota valida o solo e devolve a lacuna quando o usuário informa “não sei”; não persiste a área nem emite recomendação. A UC-04, sobre regime hídrico, terá implementação separada.

## Consequências

- A PoC terá dois processos em execução, o que requer configurar origem da API e acesso entre aplicações na integração.
- Os valores da API são estáveis e independentes de idioma (`known`, `unknown`, `rainfed`, `irrigated`); a interface apresenta rótulos traduzidos.
- Um solo desconhecido é entrada válida e aparece como lacuna para análises que dependam dele.
- O modelo de solo aceita texto e classificação sem impor uma taxonomia única aos casos do Brasil e dos EUA.

## Ainda em aberto

- Estratégia de persistência, autenticação e deploy.
- Contrato completo de área, localização, regime hídrico e histórico quando as demais cards forem integradas.
- Campos de solo que cada regra regional exigirá para avaliar uma rotação.
