# ADR-0008: Cenários simulados na stack única

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** US-01, [ADR-0004](0004-stack-da-poc.md), [ADR-0007](0007-historico-de-cultivo.md)

## Contexto

O primeiro PR da US-01 criou uma segunda aplicação Next.js em `src/interface` e outra API FastAPI em `src/api`. As UC-03 a UC-05 já usam `frontend` e `backend`. Seus contratos de solo, regime hídrico e histórico também diferiam dos campos das fixtures de cenário.

## Decisão

- Manter uma aplicação Next.js em `frontend` e uma API FastAPI em `backend`.
- Expor a seleção em `/` e o detalhe em `/scenarios/[id]`, consumindo `/api/scenarios` através de rotas proxy do Next.js.
- Validar as fixtures simuladas com os modelos existentes de solo, regime hídrico e histórico. Usar `rainfed`/`irrigated` e períodos `AAAA-MM`.
- Identificar todos os cenários e dados da fixture como fictícios. Um cenário não é uma propriedade real, evidência agronômica ou resultado de dados NASA.
- Manter a US-01 empilhada sobre a branch da UC-05 enquanto as cards anteriores ainda não estiverem na `main`; ajustar a base do PR para mostrar somente mudanças da US-01.

## Consequências

- Não há servidor ou instalação de dependências duplicados.
- Os exemplos seguem os mesmos contratos das telas de entrada, mas a US-01 apenas permite explorar o cenário. Preencher automaticamente uma área a partir dele exige uma ação explícita em uma card posterior.
- A migração remove os pacotes do frontend antigo. O frontend compartilhado usa Next 16.4.6 e deve manter o audit de dependências como verificação antes de deploy.
