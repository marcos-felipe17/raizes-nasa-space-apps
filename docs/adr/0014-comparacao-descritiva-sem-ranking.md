# ADR-0014: Comparação descritiva sem ranking

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-16, [ADR-0003](0003-metodo-de-analise-e-confiabilidade.md), [ADR-0013](0013-geracao-somente-em-contexto-auditado.md)

## Contexto

A UC-16 exige opções lado a lado, com estado e indicadores. A UC-15 só pode gerar sequências em região auditada, e o catálogo de produção ainda está vazio. A UC-13 ainda não fornece indicadores agronômicos ou R calculável. Comparar por produtividade, solo ou água agora exigiria inventar valores.

## Decisão

- O backend monta a comparação a partir da proposta e do gerador da UC-15. Não aceita alternativas nem scores enviados pelo cliente.
- Cada coluna expõe estado da regra estrutural da UC-11, culturas e períodos, presença das culturas na lista do agricultor, vínculo com fonte regional e adequação indisponível.
- A proposta aparece mesmo quando não há alternativas verificadas. Nesse caso, o resultado é `limited`, com a lacuna explícita. Contextos sintéticos ficam restritos aos testes.
- Não há ranking, desempate, R nem afirmação de que uma opção é superior. Os dados atuais permitem apenas trade-offs descritivos.

## Consequências

- O contrato e a tela estão prontos para mostrar opções reais após a auditoria de uma região.
- Para comparar efeitos agronômicos, a UC-13 precisa acrescentar indicadores calculáveis, limites e procedência; a UC-17 só poderá reordenar opções quando esses critérios existirem.
- Este PR parte da branch da UC-15 para manter o diff isolado enquanto a cadeia de PRs segue aberta.
