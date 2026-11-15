# ADR-0003: Método de análise e confiabilidade das rotações

- **Status:** aceito como direção da PoC; regras, parâmetros e limiares dependem de auditoria e validação
- **Data:** 2026-11-15
- **Complementa:** [ADR-0001](0001-arquitetura-do-raizes.md) e [ADR-0002](0002-unidade-e-casos-da-poc.md)

## Pergunta

Como analisar rotações em propriedades brasileiras e norte-americanas, com solos, clima, culturas e manejo diferentes, sem alegar que o sistema conhece uma única "melhor rotação" para qualquer local?

## Decisão

Adotar uma **combinação de dados observados, regras agronômicas regionais e comparação multicritério explicável**. A PoC não usa um modelo preditivo de produtividade ou um modelo de linguagem para decidir a rotação. Um modelo de linguagem pode futuramente ajudar a redigir explicações a partir de resultados estruturados e fontes verificadas, sem criar regras ou scores.

O fluxo do motor será:

1. **Montar o perfil da área:** localização, solo, regime hídrico, histórico, manejo, culturas disponíveis e prioridades, sempre com origem de cada campo.
2. **Verificar cobertura e procedência:** confirmar região, período, unidade, resolução, versão e lacunas dos dados ambientais, de solo e das regras locais.
3. **Formar candidatos:** aceitar a sequência proposta pelo usuário; gerar alternativas somente para combinações de local e culturas cuja cobertura foi verificada.
4. **Aplicar restrições verificáveis:** eliminar opções incompatíveis. Dado obrigatório ausente produz estado inconclusivo; ausência de regra não significa aprovação nem proibição.
5. **Comparar opções elegíveis:** calcular indicadores que tenham definição, dados e fonte suficientes, com prioridades explícitas. Mostrar trade-offs e sensibilidade à mudança de prioridades. R é um índice experimental de comparação, não probabilidade de sucesso.
6. **Agregar suporte comunitário:** calcular Q separadamente apenas quando houver relatos reais independentes e comparáveis. Resultados de experimentos publicados e relatos sintéticos conservam rótulos próprios e não são tratados automaticamente como relatos comunitários.
7. **Explicar ou abster-se:** devolver motivos, fontes, lacunas e estado de cada opção. Nenhum ranking é obrigatório quando a evidência não sustenta a ordenação.

O produto usará a expressão **"alternativas para explorar"** ou **"opções melhor avaliadas nos critérios disponíveis"**, não "a melhor rotação possível".

## Fontes por função

| Função | Brasil, caso Sinop | EUA, caso Iowa | Limite |
|---|---|---|---|
| Contexto meteorológico | NASA POWER; outras fontes NASA apenas se auditadas | NASA POWER; outras fontes NASA apenas se auditadas | Grade regional não mede o clima exato da parcela. |
| Solo da área | Dados publicados do experimento e informação fornecida pelo usuário | Dados publicados do experimento; SSURGO pode dar contexto cartográfico | Mapa de solo não substitui análise de solo da parcela. |
| Janela e adequação climática | ZARC, quando cobrir município, cultura, solo e safra | Orientação técnica estadual/local aplicável | ZARC não define sozinho uma rotação completa; normas nacionais do NRCS não substituem orientação estadual. |
| Sequência, cobertura e manejo | Pesquisa regional da Embrapa e resultados do experimento | Pesquisa de Iowa State e guia técnico local do NRCS/Extension | Princípios gerais devem ser convertidos em regras rastreáveis para o caso. |
| Evidência de resultado | Observações publicadas da área experimental | Observações publicadas de Marsden Farm | Observação histórica não prova o resultado futuro de outra propriedade. |

## O que a IA faz na PoC

"Inteligência" significa integrar fontes heterogêneas, verificar aplicabilidade local, encontrar opções comparáveis, adaptar a comparação às prioridades do agricultor e explicar a conclusão. O núcleo decisório inicial será **determinístico e auditável**. Não chamaremos uma soma de pesos de modelo preditivo; nem usaremos texto gerado como evidência agronômica.

Um modelo preditivo só poderá influenciar decisões após haver dados locais suficientes, validação fora da amostra, avaliação de calibração e revisão agronômica. Até lá, os indicadores são heurísticas explícitas e podem ficar indisponíveis.

## Verificação da confiabilidade

- Cada regra e indicador deve ter fonte, versão, local de aplicação, condições de entrada e justificativa.
- Testes devem incluir uma opção aceita, uma rejeitada por regra e uma inconclusiva por falta de dados em cada caso regional.
- Reproduzir separadamente os resultados observados dos estudos e as saídas do Raízes; divergência não deve ser escondida nem interpretada automaticamente como erro da pesquisa.
- Testar se a ordenação muda com prioridades e pesos; quando a conclusão for sensível a pequenas mudanças, mostrá-la como instável.
- Antes de uso real como orientação de plantio, exigir revisão por profissional habilitado e avaliação com dados de campo não usados na construção das regras. A PoC demonstra o processo de análise, não sua eficácia agronômica em produção.

## Alternativas rejeitadas nesta fase

| Alternativa | Motivo |
|---|---|
| Um modelo de linguagem escolher a rotação | Não garante aderência a regras locais nem reproduzibilidade. |
| Treinar agora um preditor global de produtividade | Não há base harmonizada e validada para os contextos e manejos propostos. |
| Reutilizar as mesmas regras locais no Brasil e nos EUA | Fontes, classes de solo, calendário e práticas diferem. |
| Declarar uma opção "segura" por score alto | O índice não é probabilidade calibrada nem substitui avaliação da parcela. |

## Referências iniciais

- [NASA POWER: metodologia e resolução dos dados](https://power.larc.nasa.gov/docs/methodology/).
- [MAPA: escopo do ZARC](https://www.gov.br/agricultura/pt-br/assuntos/riscos-seguro/programa-nacional-de-zoneamento-agricola-de-risco-climatico/zoneamento-agricola).
- [Embrapa: princípios de rotação de culturas](https://www.embrapa.br/web/agencia-de-informacao-tecnologica/tematicas/sistema-plantio-direto/fazendo-certo/planejando-e-executando/fase-de-implantacao/organizando-o-sistema-produtivo/rotacao-de-culturas).
- [USDA NRCS: SSURGO](https://www.nrcs.usda.gov/resources/data-and-reports/ssurgo-portal).
- [USDA NRCS: Conservation Crop Rotation, padrão nacional e orientação para uso local](https://www.nrcs.usda.gov/resources/guides-and-instructions/conservation-crop-rotation-ac-328-conservation-practice-standard).

## Pendências antes de calcular R na PoC

- Selecionar a parcela, o tratamento e o período exatos de cada experimento.
- Extrair e conferir as regras regionais aplicáveis às culturas e ao calendário escolhido.
- Definir indicadores mensuráveis, unidades, normalização, pesos e critérios mínimos de cobertura.
- Construir casos de teste com resultados esperados e registrar revisão técnica futura como requisito para uso fora da demonstração.
