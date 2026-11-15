// Exemplo fictício das telas de demonstração. Nenhum valor daqui vem da API nem de dados reais.
export const AREA_EXEMPLO = "Área 1 · Agreste de PE";

export const ROTACOES_EXEMPLO = {
  "feijao-milho": {
    rotacao: "Feijão → Milho", estado: "elegivel", detalhe: undefined, indice: "0,72",
    motivo: "",
  },
  "feijao-sorgo": {
    rotacao: "Feijão → Sorgo", estado: "inconclusiva", detalhe: "falta o solo", indice: undefined,
    motivo: "A regra local para sorgo depende do tipo de solo, e ele ainda não foi informado.",
  },
  "milho-milho": {
    rotacao: "Milho → Milho", estado: "excluida", detalhe: "mesma cultura seguida", indice: undefined,
    motivo: "A mesma cultura nas duas safras não é uma rotação. Isso não significa que o plantio seja proibido.",
  },
} as const;

export type ChaveExemplo = keyof typeof ROTACOES_EXEMPLO;
