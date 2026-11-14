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

A arquitetura conceitual está registrada em [ADR-0001](docs/adr/0001-arquitetura-do-raizes.md). A elicitação de requisitos e as user cards são mantidas no Notion. A escolha da stack, dos estudos de caso e das fontes regionais ainda está aberta.

