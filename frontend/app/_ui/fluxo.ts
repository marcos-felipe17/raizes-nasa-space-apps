// Estado do fluxo principal, guardado neste navegador com as mesmas chaves das telas de etapa.

export type Solo =
  | { status: "unknown" }
  | { status: "known"; classification: string; source: "farmer" };
export type RegimeHidrico = "rainfed" | "irrigated";
export type Area = { place: string; displayName: string; latitude: number; longitude: number };
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
} as const;

export const TEXTURAS = [
  { valor: "", rotulo: "Não sei" },
  { valor: "Textura arenosa", rotulo: "Arenoso" },
  { valor: "Textura média", rotulo: "Médio" },
  { valor: "Textura argilosa", rotulo: "Argiloso" },
];

export const CULTURAS = ["Feijão", "Milho", "Sorgo", "Mandioca", "Soja", "Milheto"];

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
  return { place: area.place, displayName: area.displayName ?? area.place, latitude: area.latitude, longitude: area.longitude };
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
