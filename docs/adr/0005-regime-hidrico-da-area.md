# ADR-0005: Regime hídrico no perfil da área

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** [ADR-0002](0002-unidade-e-casos-da-poc.md) e UC-04 no Notion

## Contexto

A UC-04 pede que o agricultor informe se o cultivo é de sequeiro ou irrigado, para evitar comparações incompatíveis. A unidade de análise decidida no ADR-0002 é uma parcela ou área de cultivo com condições próprias.

## Decisão

- O perfil validado da área exige `water_regime` com valor `rainfed` ou `irrigated`.
- O backend não infere nem preenche um valor padrão para esse campo.
- Se uma propriedade contém áreas com regimes distintos, elas são representadas em perfis de área separados; `mixed` não é aceito no contrato inicial.
- A validação devolve o regime no perfil, permitindo que futuras análises filtrem relatos e regras incompatíveis.

## Consequências

- A UC-04 acrescenta um perfil composto por solo e regime hídrico, sem alterar a rota de solo da UC-03.
- O formulário Next.js deve apresentar rótulos localizados, mas enviar os valores estáveis da API.
- Este contrato valida entradas; persistência e comparação agronômica serão implementadas em cards posteriores.
