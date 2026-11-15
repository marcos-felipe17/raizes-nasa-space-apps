# raizes-nasa-space-apps
Collaborative agricultural decision-support tool powered by NASA Earth Observations for the Field Shift Challenge (NASA Space Apps 2026).

Protótipo de apoio à decisão para explorar rotações de culturas com dados da propriedade, observações da Terra da NASA, fontes agrícolas locais e experiências comunitárias.

## Estrutura

- `src/interface/`: entrada e apresentação para o usuário.
- `src/application/`: casos de uso e coordenação do fluxo.
- `src/domain/`: regras, estados da análise e cálculo dos indicadores.
- `src/infrastructure/`: conectores de dados, persistência e cache.
- `data/fixtures/`: cenários fictícios e dados de demonstração identificados.
- `docs/adr/`: registros das decisões de arquitetura.
- `tests/`: testes de regras e fluxos quando houver implementação.

As pastas representam responsabilidades lógicas. A implementação pode começar como uma única aplicação; esta estrutura não exige serviços ou deploys separados.

## Estado do projeto

A arquitetura conceitual está registrada em [ADR-0001](docs/adr/0001-arquitetura-do-raizes.md). A unidade de análise e os estudos de caso da PoC estão registrados em [ADR-0002](docs/adr/0002-unidade-e-casos-da-poc.md). O método de análise e seus limites de confiabilidade estão em [ADR-0003](docs/adr/0003-metodo-de-analise-e-confiabilidade.md). A elicitação de requisitos e as user cards são mantidas no Notion. A escolha da stack e a validação das fontes regionais ainda estão abertas.
## Implementação

- `backend/`: API FastAPI com os contratos da UC-03 e UC-04. Veja [como executar](backend/README.md).
- `frontend/`: telas Next.js da UC-03 em `/solo` e UC-04 em `/regime-hidrico`. Veja [como executar](frontend/README.md).

A escolha da stack e o escopo da UC-03 estão registrados em [ADR-0004](docs/adr/0004-stack-da-poc.md). A modelagem do regime hídrico está em [ADR-0005](docs/adr/0005-regime-hidrico-da-area.md). O rascunho local do solo está em [ADR-0006](docs/adr/0006-rascunho-local-do-solo.md).
