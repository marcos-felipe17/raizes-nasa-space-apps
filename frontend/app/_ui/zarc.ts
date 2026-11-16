// Tipos e textos do ZARC (Zoneamento Agrícola de Risco Climático, MAPA) usados nas telas.

export type EstadoZarc = "eligible" | "excluded" | "inconclusive" | "no_coverage";
export type MotivoZarc =
  | "indicated" | "out_of_window" | "depends_on_soil_or_cycle" | "missing_source_value"
  | "crop_not_zoned" | "regime_not_zoned" | "municipality_not_zoned" | "same_crop_in_sequence";

export type SafraZarc = { crop: string; planting_decendio: number };

export type ResultadoSafra = SafraZarc & {
  status: EstadoZarc;
  reason: MotivoZarc;
  zarc_crop: string | null;
  risk_min: number | null;
  risk_max: number | null;
  indicated_always: number[];
  indicated_sometimes: number[];
  depends_on: ("soil" | "cycle")[];
  ordinances: string[];
};

export type FonteZarc = { name: string; crop_year: string; url: string; downloaded_on: string };

export type ResultadoZarc = {
  status: EstadoZarc;
  municipality: string | null;
  uf: string | null;
  seasons: ResultadoSafra[];
  source: FonteZarc;
  soil_used: boolean;
  notes: string[];
};

export type JanelaCultura = {
  crop: string;
  indicated_always: number[];
  indicated_sometimes: number[];
  lowest_risk: number[];
  regime_zoned: boolean;
};

export type CoberturaZarc = {
  covered: boolean;
  municipality: string | null;
  crops: string[];
  windows: JanelaCultura[];
  source: FonteZarc;
};

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
export const PARTES = ["início", "meio", "fim"] as const;

/** Decêndio 1 = 1 a 10 de janeiro; 36 = 21 a 31 de dezembro. */
export function decendio(mes: number, parte: number): number {
  return mes * 3 + parte + 1;
}

export function partesDoDecendio(valor: number): { mes: number; parte: number } {
  return { mes: Math.floor((valor - 1) / 3), parte: (valor - 1) % 3 };
}

export function nomeDecendio(valor: number): string {
  const { mes, parte } = partesDoDecendio(valor);
  return `${PARTES[parte]} de ${MESES[mes]}`;
}

/** Agrupa decêndios (que podem virar o ano) em trechos contínuos e escreve em texto. */
export function descreverJanela(decendios: number[]): string {
  if (!decendios.length) return "";
  const ordem = [...new Set(decendios)].sort((a, b) => a - b);
  const trechos: number[][] = [];
  for (const valor of ordem) {
    const atual = trechos[trechos.length - 1];
    if (atual && valor === atual[atual.length - 1] + 1) atual.push(valor);
    else trechos.push([valor]);
  }
  if (trechos.length > 1 && trechos[0][0] === 1 && trechos[trechos.length - 1].slice(-1)[0] === 36) {
    const primeiro = trechos.shift() as number[];
    trechos[trechos.length - 1].push(...primeiro);
  }
  return trechos
    .map((trecho) => trecho.length === 1
      ? nomeDecendio(trecho[0])
      : `${nomeDecendio(trecho[0])} a ${nomeDecendio(trecho[trecho.length - 1])}`)
    .join(" e ");
}

export function riscoTexto(safra: ResultadoSafra): string {
  if (safra.risk_min === null) return "";
  return safra.risk_min === safra.risk_max
    ? `risco climático de ${safra.risk_min}%`
    : `risco climático de ${safra.risk_min}% a ${safra.risk_max}%`;
}

/** Frase curta para o cartão da safra. */
export function resumoSafra(safra: ResultadoSafra): string {
  switch (safra.reason) {
    case "indicated":
      return riscoTexto(safra);
    case "out_of_window":
      return "Fora da época indicada";
    case "depends_on_soil_or_cycle":
      return safra.depends_on.includes("soil") && safra.depends_on.includes("cycle")
        ? "Depende do solo e do ciclo da semente"
        : safra.depends_on.includes("soil") ? "Depende do tipo de solo" : "Depende do ciclo da semente";
    case "missing_source_value":
      return "A tabela oficial está incompleta aqui";
    case "crop_not_zoned":
      return "O ZARC não cobre essa cultura aqui";
    case "regime_not_zoned":
      return "Sem zoneamento para esse tipo de água";
    case "municipality_not_zoned":
      return "O ZARC não cobre esse município";
    case "same_crop_in_sequence":
      return "Mesma cultura da safra anterior";
  }
}

/** Explicação simples, uma ou duas frases. */
export function explicacaoSafra(safra: ResultadoSafra): string {
  const janela = descreverJanela(safra.indicated_always.length ? safra.indicated_always : safra.indicated_sometimes);
  switch (safra.reason) {
    case "indicated":
      return "Essa data está na época que o ZARC indica para essa cultura aqui.";
    case "out_of_window":
      return janela ? `A época indicada aqui é: ${janela}.` : "O ZARC não indica nenhuma época para essa cultura aqui.";
    case "depends_on_soil_or_cycle":
      return `Nessa data, só alguns tipos de solo ou de semente estão dentro da época. ${
        janela ? `Para qualquer solo e semente, a época segura é: ${janela}.` : ""}`.trim();
    case "missing_source_value":
      return "A tabela publicada pelo MAPA está sem valor nessa data. Não completamos o dado.";
    case "crop_not_zoned":
      return "Isso não quer dizer que seja proibido; só que não há época oficial publicada para conferir.";
    case "regime_not_zoned":
      return "O zoneamento dessa cultura aqui só vale para o outro tipo de água (chuva ou irrigação).";
    case "municipality_not_zoned":
      return "Sem zoneamento, não temos uma regra oficial para conferir a época de plantio.";
    case "same_crop_in_sequence":
      return "Plantar a mesma cultura em seguida não é rotação. Isso não quer dizer que seja proibido.";
  }
}

export const ESTADO_VISUAL: Record<EstadoZarc, "elegivel" | "inconclusiva" | "excluida" | "indisponivel"> = {
  eligible: "elegivel",
  inconclusive: "inconclusiva",
  excluded: "excluida",
  no_coverage: "indisponivel",
};

export const ROTULO_ZARC: Record<EstadoZarc, string> = {
  eligible: "Dentro da época",
  inconclusive: "Inconclusiva",
  excluded: "Fora da regra",
  no_coverage: "Sem cobertura",
};

export function culturasNaEpoca(janelas: JanelaCultura[], valor: number, exceto: string): string[] {
  return janelas
    .filter((janela) => janela.regime_zoned && janela.crop !== exceto && janela.indicated_always.includes(valor))
    .map((janela) => janela.crop);
}
