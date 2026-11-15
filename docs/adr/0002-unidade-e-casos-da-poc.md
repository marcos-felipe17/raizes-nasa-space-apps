# ADR-0002: Unidade de análise e casos da PoC

- **Status:** aceito para a PoC; seleção de parcelas e dados ainda em validação
- **Data:** 2026-11-15
- **Complementa:** [ADR-0001](0001-arquitetura-do-raizes.md)

## Contexto

O Raízes precisa demonstrar uma análise verificável em locais reais e mostrar que o mesmo fluxo pode funcionar em regiões agrícolas distintas. Uma propriedade inteira pode conter solos, manejos e regimes hídricos diferentes. Estudos públicos de rotação frequentemente acompanham mais de duas safras.

## Decisões

1. **Unidade da análise:** parcela ou área de cultivo com condições próprias de solo, manejo e água. Uma propriedade pode conter várias áreas; resultados de áreas diferentes não são misturados em um único score.
2. **Horizonte:** sequência configurável de etapas de cultivo. A interface inicial pode mostrar duas etapas, mas o modelo deve aceitar ciclos mais longos para representar estudos publicados sem truncá-los.
3. **Caso principal no Brasil:** área experimental da Embrapa Agrossilvipastoril, em Sinop, Mato Grosso. O estudo publicado descreve parcelas com sequências envolvendo soja, milho, milheto e braquiária e apresenta resultados de grãos e palhada. A parcela, sequência e período exatos da fixture serão selecionados após extração e conferência da publicação.
4. **Segundo caso nos Estados Unidos:** Marsden Farm Experiment, próximo a Boone, Iowa. O estudo publicado compara um sistema milho-soja de dois anos com um sistema diversificado de quatro anos. A fixture deve preservar a duração e o manejo associados a cada sistema.
5. **Separação de evidências:** resultados de campo publicados são observações do experimento; dados NASA descrevem o contexto ambiental; indicadores do Raízes são avaliações do sistema. A interface e os dados de saída devem identificar essas três origens separadamente.
6. **Sequência de implementação:** validar primeiro o caso de Sinop, depois adaptar o mesmo fluxo a Iowa. A existência de uma publicação não dispensa conferir cobertura, período, unidades e regras locais antes de calcular indicadores.

## Evidência consultada

- [Embrapa: campo experimental em Sinop](https://www.embrapa.br/en/web/agrossilvipastoril/campo).
- [Embrapa: produção de grãos e palhada em diferentes rotações](https://ainfo.cnptia.embrapa.br/digital/bitstream/item/200276/1/2019-cpamt-agrossilvipastoril-part-1-cap-4-producao-graos-palhada-diferentes-rotacoes-culturas-sistema-plantio-direto-p-47-51.pdf).
- [Iowa State University: Marsden Farm Experiment e impactos de sistemas diversificados](https://naturalresources.extension.iastate.edu/files/inline-files/comprehensive_impacts_of_diversified_cropping_on_soil_health_and_sustainability.pdf).
- [NASA POWER: API diária por ponto](https://power.larc.nasa.gov/docs/services/api/temporal/daily/).

## Consequências

- O perfil da área, o histórico e a análise devem referenciar a mesma parcela ou área de cultivo.
- As etapas da rotação precisam guardar ordem, cultura, período e manejo relevante; o comprimento da sequência não deve ser fixado em dois no domínio.
- As fixtures devem registrar fonte e página/tabela para cada dado de campo, além de versão, período e resolução para dados ambientais.
- O Brasil e os EUA são dois estudos de caso, não casos agroclimaticamente comparáveis entre si. O objetivo do segundo é demonstrar adaptação regional.
- Uma fazenda experimental real não deve ser apresentada como relato voluntário de um agricultor da plataforma nem como validação independente dos scores do Raízes.

## Ainda pendente de auditoria

- Parcela e tratamento específicos de Sinop e de Iowa; datas, manejo e valores a reproduzir.
- Série NASA correspondente a cada local e período, com metadados e dados faltantes.
- Fonte e granularidade das regras agronômicas para as opções da PoC.
- Definição operacional dos critérios de R e Q. Q permanece indisponível sem relatos reais elegíveis.

Se uma publicação não fornecer os campos necessários para uma análise, a fixture deve marcar a lacuna e o motor deve responder como inconclusivo no critério afetado, sem completar o dado por suposição.
