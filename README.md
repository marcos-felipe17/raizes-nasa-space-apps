# raizes-nasa-space-apps
Collaborative agricultural decision-support tool powered by NASA Earth Observations for the Field Shift Challenge (NASA Space Apps 2026).

Protótipo de apoio à decisão para explorar rotações de culturas com dados da propriedade, observações da Terra da NASA, fontes agrícolas locais e experiências comunitárias.

## Estrutura

- `backend/`: API FastAPI, modelos e testes de contratos.
- `frontend/`: aplicação Next.js para cenários e perfil da área.
- `data/fixtures/`: cenários fictícios identificados para demonstração.
- `docs/adr/`: decisões de arquitetura.
- `docs/stories/`: histórias de usuário e critérios de aceite.

## Estado do projeto

A arquitetura conceitual está registrada em [ADR-0001](docs/adr/0001-arquitetura-do-raizes.md). A unidade de análise e os estudos de caso da PoC estão registrados em [ADR-0002](docs/adr/0002-unidade-e-casos-da-poc.md). O método de análise e seus limites de confiabilidade estão em [ADR-0003](docs/adr/0003-metodo-de-analise-e-confiabilidade.md). A elicitação de requisitos e as user cards são mantidas no Notion. A seleção de cenários simulados está descrita em [US-01](docs/stories/US-01-selecionar-cenario.md). A stack está definida no ADR-0004; a validação das fontes regionais segue em aberto.

## Implementação

- `backend/`: API FastAPI com os cenários da US-01 e os contratos da UC-03, UC-04 e UC-05. Veja [como executar](backend/README.md).
- `frontend/`: seleção de cenários simulados em `/`, além das telas Next.js da UC-03 em `/solo`, UC-04 em `/regime-hidrico` e UC-05 em `/historico`. Veja [como executar](frontend/README.md).

A escolha da stack e o escopo da UC-03 estão registrados em [ADR-0004](docs/adr/0004-stack-da-poc.md). A modelagem do regime hídrico está em [ADR-0005](docs/adr/0005-regime-hidrico-da-area.md). O rascunho local do solo está em [ADR-0006](docs/adr/0006-rascunho-local-do-solo.md).

O histórico de cultivo e sua granularidade estão em [ADR-0007](docs/adr/0007-historico-de-cultivo.md).

A integração da US-01 na stack única está registrada em [ADR-0008](docs/adr/0008-cenarios-simulados-na-stack-unica.md).
