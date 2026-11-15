"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Season = { crop: string; start_month: string; end_month: string };
type Proposal = { seasons: Season[] };
type Candidates = { status: "known" | "unknown"; crops: string[] };
type Point = { latitude: number; longitude: number };
type Alternative = {
  seasons: Season[]; context_id: string; context_name: string;
  source_url: string; source_version: string; status: "explore_only"; reason: string;
};
type Result = {
  status: "generated" | "blocked";
  reason: string;
  alternatives: Alternative[];
  missing_for_generation: string[];
};

function stored(key: string): unknown {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function readInputs(): { proposal: Proposal | null; candidates: Candidates; point: Point | null } {
  const proposalDraft = stored("raizes:rotation-proposal:v1") as { proposal?: Proposal } | null;
  const candidateDraft = stored("raizes:candidate-crops:v1") as { candidate_crops?: Candidates } | null;
  const pointDraft = stored("raizes:coverage-point:v1") as Partial<Point> | null;
  const seasons = proposalDraft?.proposal?.seasons;
  const proposal = Array.isArray(seasons) && seasons.length === 2 && seasons.every((item) =>
    item && typeof item.crop === "string" && typeof item.start_month === "string" &&
    typeof item.end_month === "string") ? { seasons } : null;
  const candidate = candidateDraft?.candidate_crops;
  const candidates: Candidates = candidate?.status === "known" && Array.isArray(candidate.crops) &&
    candidate.crops.every((item) => typeof item === "string")
    ? candidate : { status: "unknown", crops: [] };
  const point = typeof pointDraft?.latitude === "number" && typeof pointDraft.longitude === "number" &&
    Number.isFinite(pointDraft.latitude) && Number.isFinite(pointDraft.longitude)
    ? { latitude: pointDraft.latitude, longitude: pointDraft.longitude } : null;
  return { proposal, candidates, point };
}

function isResult(value: unknown): value is Result {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<Result>;
  return (result.status === "generated" || result.status === "blocked") &&
    typeof result.reason === "string" && Array.isArray(result.missing_for_generation) &&
    Array.isArray(result.alternatives) && result.alternatives.every((item) =>
      item && Array.isArray(item.seasons) && item.seasons.length === 2 &&
      item.seasons.every((season) => season && typeof season.crop === "string" &&
        typeof season.start_month === "string" && typeof season.end_month === "string") &&
      typeof item.context_name === "string" && typeof item.source_url === "string" &&
      typeof item.source_version === "string" && item.status === "explore_only");
}

export default function AlternativesExplorer() {
  const [inputs, setInputs] = useState<ReturnType<typeof readInputs> | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setInputs(readInputs()); }, []);

  async function generate() {
    if (!inputs?.proposal || !inputs.point) return;
    setBusy(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/alternatives", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: inputs.point.latitude, longitude: inputs.point.longitude,
          proposal: inputs.proposal, candidate_crops: inputs.candidates,
        }),
      });
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (!isResult(data)) throw new Error();
      setResult(data);
    } catch { setMessage("Não foi possível consultar alternativas agora. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <div className="content-grid">
    <section className="form-card">
      <h2 className="form-heading">Dados para a busca</h2>
      {!inputs ? <p>Carregando rascunhos…</p> : <>
        <ul className="alternative-inputs">
          <li>{inputs.proposal ? "Proposta de duas safras registrada" : <Link href="/rotacao">Informar proposta de duas safras</Link>}</li>
          <li>{inputs.point ? `Ponto aproximado: ${inputs.point.latitude.toFixed(3)}, ${inputs.point.longitude.toFixed(3)}` : <Link href="/localizacao">Informar localização</Link>}</li>
          <li>{inputs.candidates.status === "known" ? `${inputs.candidates.crops.length} culturas candidatas registradas` : <Link href="/culturas-possiveis">Informar culturas candidatas</Link>}</li>
        </ul>
        <button className="primary-button" type="button" disabled={busy || !inputs.proposal || !inputs.point}
          onClick={() => void generate()}>{busy ? "Consultando…" : "Buscar alternativas"}</button>
        <p className="field-hint">Os rascunhos deste navegador ainda não estão vinculados a um identificador persistente de área.</p>
      </>}
      {message && <p className="status-message" role="alert">{message}</p>}
    </section>
    <section className="summary-card" aria-live="polite">
      <h2>Alternativas</h2>
      {!result ? <p>A busca só retornará opções quando existir um contexto regional auditado e aplicável.</p> : result.status === "blocked" ? <>
        <p className="notice"><strong>Geração indisponível.</strong> {result.reason}</p>
        {result.missing_for_generation.includes("verified_region_rules") && <p>Ainda não há região com parcela, períodos e regras auditadas no catálogo do Raízes.</p>}
        {result.missing_for_generation.includes("candidate_crops") && <p>Informe as culturas que você pode considerar.</p>}
        {result.missing_for_generation.includes("applicable_sequence") && <p>Nenhuma sequência documentada atende à lista de culturas candidatas neste contexto.</p>}
      </> : <>
        <p>{result.reason}</p>
        <div className="alternative-list">{result.alternatives.map((item) => <article className="restriction-rule" key={`${item.context_id}-${item.seasons.map((s) => s.crop).join("-")}`}>
          <h3>{item.seasons.map((s) => s.crop).join(" → ")}</h3>
          <ol className="history-summary">{item.seasons.map((season, index) => <li key={index}><strong>{season.crop}</strong><span>{season.start_month} a {season.end_month}</span></li>)}</ol>
          <p>{item.reason}</p><p><strong>Contexto:</strong> {item.context_name} · {item.source_version}</p>
          <a href={item.source_url} target="_blank" rel="noopener noreferrer">Consultar fonte</a>
        </article>)}</div>
      </>}
    </section>
  </div>;
}
