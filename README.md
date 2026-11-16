# raizes-nasa-space-apps
Collaborative agricultural decision-support tool powered by NASA Earth Observations for the Field Shift Challenge (NASA Space Apps 2026).

Protótipo de apoio à decisão para explorar rotações de culturas com dados da propriedade, observações da Terra da NASA, fontes agrícolas locais e experiências comunitárias.

## Estrutura

- `backend/`: API FastAPI, contratos, scripts de dados e testes.
- `frontend/`: aplicação Next.js com as telas do perfil da área.
- `data/fixtures/`: dados de demonstração identificados, incluindo as séries da NASA POWER.
- `docs/adr/`: registros das decisões de arquitetura.
- `docs/uso-de-ia-no-desenvolvimento.md`: registro de como a equipe utilizou IA na construção do protótipo.
- `src/` e `tests/`: esqueleto das camadas lógicas do [ADR-0001](docs/adr/0001-arquitetura-do-raizes.md), ainda sem código. A implementação atual está em `backend/` e `frontend/`.

## Estado do projeto

A arquitetura conceitual está registrada em [ADR-0001](docs/adr/0001-arquitetura-do-raizes.md). A unidade de análise e os estudos de caso da PoC estão registrados em [ADR-0002](docs/adr/0002-unidade-e-casos-da-poc.md). O método de análise e seus limites de confiabilidade estão em [ADR-0003](docs/adr/0003-metodo-de-analise-e-confiabilidade.md). A elicitação de requisitos e as user cards são mantidas no Notion. A stack está definida no [ADR-0004](docs/adr/0004-stack-da-poc.md); a validação das fontes regionais segue em aberto.

## Implementação

- `backend/`: API FastAPI com os contratos da UC-02, UC-03, UC-04, UC-05, UC-06 e UC-08. Veja [como executar](backend/README.md).
- `frontend/`: telas Next.js da UC-02 em `/localizacao`, UC-03 em `/solo`, UC-04 em `/regime-hidrico`, UC-05 em `/historico` UC-06 em `/culturas-possiveis` e UC-08 em `/cobertura`. O fluxo principal começa em `/` (início, três passos e resultado) e a lista de etapas em detalhe fica em `/etapas`. Veja [como executar](frontend/README.md).

A escolha da stack e o escopo da UC-03 estão registrados em [ADR-0004](docs/adr/0004-stack-da-poc.md). A modelagem do regime hídrico está em [ADR-0005](docs/adr/0005-regime-hidrico-da-area.md). O rascunho local do solo está em [ADR-0006](docs/adr/0006-rascunho-local-do-solo.md).

O histórico de cultivo e sua granularidade estão em [ADR-0007](docs/adr/0007-historico-de-cultivo.md).

A distinção entre culturas candidatas e elegíveis está registrada em [ADR-0009](docs/adr/0009-culturas-candidatas-sem-elegibilidade.md).

A verificação de cobertura por ponto está em [ADR-0010](docs/adr/0010-cobertura-verificada-por-ponto.md).

O protótipo registra e confere dados da área. Ele ainda não avalia nem recomenda rotações.
