# ADR-0017: Tábua de Risco do ZARC como regra de época de plantio

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** [ADR-0003](0003-metodo-de-analise-e-confiabilidade.md), [ADR-0013](0013-geracao-somente-em-contexto-auditado.md), UC-11, UC-13

## Contexto

Testando o fluxo, toda rotação com culturas diferentes saía "inconclusiva", porque não havia nenhuma regra regional carregada. A ADR-0003 já previa o ZARC como fonte de janela e adequação climática no Brasil.

O MAPA publica a **Tábua de Risco do ZARC** em dados abertos: uma linha por município, cultura, manejo (sequeiro ou irrigado), solo e grupo de ciclo, com o risco climático (20, 30 ou 40%) de cada um dos 36 decêndios do ano. É o mesmo conteúdo das portarias, em formato de tabela, e cada linha cita a portaria de origem. Por ser tabela publicada pelo próprio ministério, não exige transcrição manual de PDF.

## Decisão

- Versionar o recorte da safra 2025/2026 em `data/fixtures/zarc/2025-2026/`, um arquivo por UF, gerado por `backend/scripts/build_zarc_fixture.py` a partir do CSV oficial. O script não altera valores; os 48 decêndios vazios na fonte viram `?` e o motor os trata como dado ausente. `procedencia.json` guarda URL, data de modificação, SHA-256 do arquivo de origem e data de download.
- Avaliar **cada safra** pela tábua (`POST /api/v1/zarc/evaluate`):
  - município fora da tábua, cultura não zoneada ou manejo sem zoneamento: `no_coverage` (nunca proibição);
  - decêndio indicado para todos os solos e ciclos aplicáveis: `eligible`, com a faixa de risco e as portarias;
  - indicado só para parte dos solos ou ciclos: `inconclusive`, dizendo do que depende;
  - valor vazio na fonte: `inconclusive`;
  - não indicado em nenhum solo ou ciclo: `excluded`, mostrando a época indicada;
  - mesma cultura em safras seguidas: `excluded` (regra estrutural da UC-11).
- A textura informada (arenoso, médio, argiloso) só filtra linhas classificadas por textura (solos 1, 2 e 3). As classes de água disponível AD1 a AD6 não são deduzidas da textura.
- O estado da rotação é o pior entre as safras. O risco do ZARC é exibido como risco de perda por clima na época de plantio, **nunca** somado ou transformado em nota da rotação.
- `POST /api/v1/zarc/coverage` lista as culturas zoneadas no município e as épocas indicadas, para a tela sugerir datas dentro da janela.
- A rotação aceita de uma a seis safras na API; a interface permite até quatro.

## Consequências

- O fluxo passa a dar resultado conclusivo, com fonte oficial, para qualquer município coberto pelo ZARC.
- Sinop e a maioria dos municípios do Centro-Oeste usam as classes AD1 a AD6; nesses casos, informar a textura não fecha o resultado e a tela pede análise de solo.
- O app ainda não pergunta o grupo de ciclo da cultivar; quando o resultado depende dele, a tela avisa.
- O ZARC não confere se a safra seguinte cabe depois da colheita da anterior. A sugestão de data na tela assume cerca de 100 dias entre o plantio de uma safra e o da seguinte, só como ponto de partida editável.
- Fora do Brasil (caso de Iowa) não há regra equivalente carregada: o resultado é `no_coverage`.
- A tábua muda a cada safra e por portaria; atualizar exige rodar o script com o CSV novo e revisar o diff.

## Alternativas consideradas

| Alternativa | Motivo para não adotar agora |
|---|---|
| Transcrever as portarias em PDF | A extração embaralha colunas; a tábua em CSV é a mesma informação, publicada pelo MAPA. |
| Consultar o mapa de solos SoilGrids (ISRIC) para estimar a textura | Testado em 15/11/2026: uma consulta estourou 30 s e outra voltou sem valores para Sinop. Pode entrar depois como sugestão, nunca como dado da parcela. |
| Identificar o solo por foto com modelo de visão | Fica como evolução. Exigiria base rotulada de solos brasileiros, avaliação de acerto e deixar claro que é estimativa; a confirmação continua sendo a análise de laboratório. |

## Fonte

- [MAPA, dados abertos: Zarc - Tábua de Risco](https://dados.agricultura.gov.br/dataset/tabua-de-risco-zoneamento-agricola-de-risco-climatico), com dicionário de dados.
