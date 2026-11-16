# ADR-0017: Evidências experimentais de Sinop sem extrapolação regional

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** [ADR-0002](0002-unidade-e-casos-da-poc.md), [ADR-0003](0003-metodo-de-analise-e-confiabilidade.md), [ADR-0013](0013-geracao-somente-em-contexto-auditado.md)

## Contexto

O capítulo 4 da Embrapa Agrossilvipastoril (2019, páginas impressas 48–51) relata um experimento de plantio direto em Sinop, em Latossolo Vermelho Amarelo argiloso, com parcelas de 30 m². As tabelas 2 e 4 contêm resultados de 2014 e 2016 para tratamentos soja/milho, soja/milheto e soja/milho consorciado com braquiária. A tabela 3 apresenta rendimento de soja em 2015/2016. A NASA POWER já fornece uma série diária de temperatura e precipitação para um ponto próximo, de 2014 a 2024.

## Decisão

- Registrar os valores publicados como **observações históricas do experimento**, com tratamento, ano, variável, unidade, tabela e fonte. Não convertê-los em notas de adequação ou previsão para outra propriedade.
- Registrar como regras de referência apenas os princípios de plantio direto e a sequência observada descritos no capítulo. Ambos são `machine_checkable_with_current_inputs=false`: as entradas atuais não comprovam o manejo, o talhão, a época de semeadura ou as condições de aplicação.
- Expor pela API uma consulta somente leitura que retorna as observações, regras de referência, lacunas e metadados da série NASA. Manter `region_verified_for_generation=false` e o catálogo da UC-15 vazio.
- Manter tratamentos com densidade dupla de braquiária e sequência com algodão fora deste recorte inicial, para não misturar manejos. O tratamento consorciado registrado corresponde ao de densidade padrão.

## Lacunas antes de ativar regras para a propriedade

- Identificador e limite geográfico das parcelas por tratamento; meses exatos de plantio e colheita; variedade, solo e manejo da área do usuário.
- Regras locais auditadas para cultura, safra, solo e janela de plantio, com fonte e versão aplicáveis ao local.
- Revisão agronômica do mapeamento entre tratamentos, indicadores e condições de uso. A climatologia da NASA é contexto, não validação de uma rotação.

## Fontes

- [Embrapa, capítulo 4, páginas 48–51 e tabelas 2–4](https://ainfo.cnptia.embrapa.br/digital/bitstream/item/200276/1/2019-cpamt-agrossilvipastoril-part-1-cap-4-producao-graos-palhada-diferentes-rotacoes-culturas-sistema-plantio-direto-p-47-51.pdf).
- [NASA POWER, API diária por ponto](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).
