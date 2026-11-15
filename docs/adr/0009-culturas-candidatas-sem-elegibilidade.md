# ADR-0009: Culturas candidatas não são culturas elegíveis

- **Status:** aceito para a PoC
- **Data:** 2026-11-15
- **Relacionado:** UC-06, [ADR-0003](0003-metodo-de-analise-e-confiabilidade.md)

## Contexto

A UC-06 permite que o agricultor informe culturas que estão ao seu alcance. Essa lista expressa disponibilidade e preferência, mas não comprova adequação ao solo, à água, à região ou à sequência de cultivo. As verificações agronômicas pertencem às cards posteriores.

## Decisão

- Registrar uma lista de nomes de culturas candidatas ou o estado explícito `unknown` quando o agricultor ainda não souber.
- Validar nomes não vazios e sem duplicatas; limitar a lista conhecida a 30 itens na PoC.
- A API devolve `eligibility_evaluated: false` em toda resposta da UC-06. A interface descreve as culturas como opções **a avaliar**.
- Uma lista desconhecida gera a lacuna `candidate_crops` para as análises que dependem desse dado.
- Até a integração com a UC-02, guardar a última resposta validada como rascunho local do navegador.

## Consequências

- O motor poderá restringir alternativas à lista conhecida, mas precisará aplicar regras de elegibilidade antes de propor qualquer cultura.
- A ausência da lista não será preenchida com culturas inferidas de dados regionais ou de cenários simulados.
- Os cenários fictícios da US-01 usam os mesmos critérios de validação dos nomes e exibem suas culturas como candidatas.
