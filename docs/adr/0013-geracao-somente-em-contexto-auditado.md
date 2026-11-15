# ADR-0013: Geração somente em contexto regional auditado

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-15, [ADR-0002](0002-unidade-e-casos-da-poc.md), [ADR-0003](0003-metodo-de-analise-e-confiabilidade.md)

## Contexto

A UC-15 pede alternativas além da proposta e restringe a geração a região verificada. Os casos de Sinop e Iowa têm publicações iniciais, mas a auditoria de parcela, sequência, datas e regras locais segue pendente. As UCs 12–14 ainda não entregam lacunas detalhadas, R ou explicações completas. Climatologia NASA disponível não comprova elegibilidade de uma cultura para uma parcela.

## Decisão

- O backend mantém o catálogo de contextos verificados sob controle do servidor. O cliente informa coordenadas, proposta e culturas candidatas; não pode enviar um sinal de `verified_region`.
- Cada contexto do catálogo exigirá limites geográficos, fonte, versão e sequências completas com culturas e períodos auditados. A geração usa **somente** essas sequências, sem inventar cultura ou calendário, limita a cinco opções e exclui uma sequência idêntica à proposta.
- Uma sequência só aparece se suas culturas constarem da lista conhecida do agricultor. A saída é `explore_only`, com fonte e contexto, sem R, ranking ou aprovação da parcela.
- O catálogo de produção começa vazio. Sinop e Iowa não são marcados verificados por conterem uma publicação ou cobertura NASA. Sem registro aplicável, o motor devolve `blocked`, lista vazia e lacuna explícita.
- Testes usam um contexto **sintético, exclusivamente de teste**, para exercitar o caminho positivo e as travas de região e culturas.

## Consequências

- A UC-15 tem contrato, fluxo de interface e gerador verificável, mas não apresenta alternativas reais até a auditoria agronômica do primeiro contexto.
- Para habilitar Sinop, a equipe precisa selecionar parcela e tratamento, confirmar calendário e culturas da fonte, conferir o alcance geográfico e associar as regras locais e o manejo ao contexto; depois registrar revisão técnica antes de inserir o contexto no catálogo.
- Quando a UC-10 for integrada à `main`, este PR pode ser rebaseado e retargetado na ordem das dependências. A UC-15 depende dos resultados regionais das UCs 11–14 para apresentar avaliações além de sequências documentadas.
