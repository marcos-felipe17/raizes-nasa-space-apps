// Estado do fluxo principal, guardado neste navegador com as mesmas chaves das telas de etapa.

export type Solo =
  | { status: "unknown" }
  | { status: "known"; classification: string; source: "farmer" };
export type RegimeHidrico = "rainfed" | "irrigated";
export type Clima = {
  chuvaAno: number | null;
  temperatura: number | null;
  mesesChuvosos: string[];
  mesesSecos: string[];
};
export type Area = {
  place: string;
  displayName: string;
  latitude: number;
  longitude: number;
  clima: Clima | null;
  municipio: string | null;
  uf: string | null;
  ibge: string | null;
};
export type Safra = { crop: string; start_month: string; end_month: string };
export type Proposta = { seasons: Safra[] };
export type EstadoApi = "excluded" | "inconclusive";
export type OpcaoComparada = { kind: "proposal" | "alternative"; seasons: Safra[]; state: EstadoApi; state_reason: string };

export const CHAVES = {
  area: "raizes:area:v1",
  ponto: "raizes:coverage-point:v1",
  solo: "raizes:soil:v1",
  perfil: "raizes:profile:v1",
  culturas: "raizes:candidate-crops:v1",
  proposta: "raizes:rotation-proposal:v1",
  resultado: "raizes:resultado:v1",
  safras: "raizes:safras:v1",
} as const;

/** Textura no formato do ZARC: 1 arenoso, 2 médio, 3 argiloso. */
export function texturaZarc(solo: Solo | null): 1 | 2 | 3 | null {
  if (solo?.status !== "known") return null;
  const indice = TEXTURAS.findIndex((textura) => textura.valor === solo.classification);
  return indice >= 1 && indice <= 3 ? (indice as 1 | 2 | 3) : null;
}

export function regimeGuardado(): RegimeHidrico {
  const perfil = ler<{ profile?: { water_regime?: string } }>(CHAVES.perfil);
  return perfil?.profile?.water_regime === "irrigated" ? "irrigated" : "rainfed";
}

export type SafraEscolhida = { crop: string; planting_decendio: number };

export function lerSafras(): SafraEscolhida[] | null {
  const safras = ler<unknown>(CHAVES.safras);
  if (!Array.isArray(safras) || safras.length < 1) return null;
  const validas = safras.every((s) => s && typeof s.crop === "string" &&
    Number.isInteger(s.planting_decendio) && s.planting_decendio >= 1 && s.planting_decendio <= 36);
  return validas ? (safras as SafraEscolhida[]) : null;
}

export const TEXTURAS = [
  { valor: "", rotulo: "Não sei" },
  { valor: "Textura arenosa", rotulo: "Arenoso" },
  { valor: "Textura média", rotulo: "Médio" },
  { valor: "Textura argilosa", rotulo: "Argiloso" },
];

export const CULTURAS = ["Feijão", "Milho", "Sorgo", "Mandioca", "Soja", "Milheto"];
/** Culturas que o app oferece além das do ZARC; aparecem como "sem cobertura" quando escolhidas. */
export const CULTURAS_EXTRAS = ["Mandioca", "Milheto"];

export function ler<T>(chave: string): T | null {
  try {
    const bruto = window.localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function gravar(chave: string, valor: unknown): void {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento local o fluxo segue, mas não lembra os dados ao recarregar.
  }
}

export function lerArea(): Area | null {
  const area = ler<Partial<Area>>(CHAVES.area);
  if (!area || typeof area.place !== "string" || typeof area.latitude !== "number" ||
    typeof area.longitude !== "number") return null;
  return {
    place: area.place, displayName: area.displayName ?? area.place,
    latitude: area.latitude, longitude: area.longitude, clima: area.clima ?? null,
    municipio: area.municipio ?? null, uf: area.uf ?? null, ibge: area.ibge ?? null,
  };
}

export function lerSolo(): Solo | null {
  const rascunho = ler<{ soil?: { status?: string; classification?: string } }>(CHAVES.solo);
  const solo = rascunho?.soil;
  if (!solo) return null;
  if (solo.status === "known" && typeof solo.classification === "string") {
    return { status: "known", classification: solo.classification, source: "farmer" };
  }
  return solo.status === "unknown" ? { status: "unknown" } : null;
}

export function lerProposta(): Proposta | null {
  const rascunho = ler<{ proposal?: { seasons?: unknown } }>(CHAVES.proposta);
  const safras = rascunho?.proposal?.seasons;
  if (!Array.isArray(safras) || safras.length !== 2) return null;
  const validas = safras.every((s) => s && typeof s.crop === "string" &&
    typeof s.start_month === "string" && typeof s.end_month === "string");
  return validas ? { seasons: safras as Safra[] } : null;
}

export function rotuloRotacao(safras: { crop: string }[]): string {
  return safras.map((s) => s.crop).join(" → ");
}

function mes(base: Date, deslocamento: number): string {
  const data = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + deslocamento, 1));
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * A tela de rotação pergunta só as culturas. O contrato da UC-10 exige um período por
 * safra, então a proposta leva meses nominais em sequência a partir do mês atual. Eles
 * só ordenam as duas etapas; não são calendário de plantio nem entram em nenhuma regra.
 */
export function montarProposta(primeira: string, segunda: string, hoje: Date = new Date()): Proposta {
  return {
    seasons: [
      { crop: primeira, start_month: mes(hoje, 0), end_month: mes(hoje, 3) },
      { crop: segunda, start_month: mes(hoje, 4), end_month: mes(hoje, 7) },
    ],
  };
}

export async function enviar<T>(rota: string, corpo: unknown): Promise<{ ok: boolean; status: number; dados: T | null }> {
  try {
    const resposta = await fetch(rota, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
    const dados = (await resposta.json().catch(() => null)) as T | null;
    return { ok: resposta.ok, status: resposta.status, dados };
  } catch {
    return { ok: false, status: 0, dados: null };
  }
}

export function detalheCurto(estado: EstadoApi): string {
  return estado === "excluded" ? "mesma cultura seguida" : "faltam regras da região";
}

/** Texto simples para o estado devolvido pela verificação de restrições (UC-11). */
export function motivoSimples(estado: EstadoApi): string {
  return estado === "excluded"
    ? "É a mesma cultura nas duas safras, então não é uma rotação. Isso não quer dizer que plantar seja proibido."
    : "As culturas são diferentes, como pede uma rotação. Mas ainda faltam as regras de plantio da sua região para dizer se ela serve para a sua área.";
}

const MESES: [string, string][] = [
  ["JAN", "jan"], ["FEB", "fev"], ["MAR", "mar"], ["APR", "abr"], ["MAY", "mai"], ["JUN", "jun"],
  ["JUL", "jul"], ["AUG", "ago"], ["SEP", "set"], ["OCT", "out"], ["NOV", "nov"], ["DEC", "dez"],
];

type ClimaApi = {
  status?: string;
  temperature_2m_c?: Record<string, number | null> | null;
  precipitation_mm_dia?: Record<string, number | null> | null;
};

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor !== -999 ? valor : null;
}

/**
 * Resume a climatologia da NASA POWER (médias históricas da região, não da parcela).
 * A chuva anual é a média diária do ano vezes 365, arredondada para a dezena.
 */
export function resumirClima(clima: ClimaApi | null | undefined): Clima | null {
  if (!clima || clima.status !== "ok") return null;
  const chuvaDia = numero(clima.precipitation_mm_dia?.ANN);
  const temperatura = numero(clima.temperature_2m_c?.ANN);
  const mensal = MESES
    .map(([chave, nome]) => ({ nome, valor: numero(clima.precipitation_mm_dia?.[chave]) }))
    .filter((mes): mes is { nome: string; valor: number } => mes.valor !== null);
  const emOrdem = [...mensal].sort((a, b) => b.valor - a.valor);
  const completo = mensal.length === 12;
  const doAno = (nomes: string[]) => MESES.map(([, nome]) => nome).filter((nome) => nomes.includes(nome));
  if (chuvaDia === null && temperatura === null) return null;
  return {
    chuvaAno: chuvaDia === null ? null : Math.round((chuvaDia * 365) / 10) * 10,
    temperatura: temperatura === null ? null : Math.round(temperatura),
    mesesChuvosos: completo ? doAno(emOrdem.slice(0, 3).map((mes) => mes.nome)) : [],
    mesesSecos: completo ? doAno(emOrdem.slice(-3).map((mes) => mes.nome)) : [],
  };
}

export function listar(nomes: string[]): string {
  if (nomes.length < 2) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
