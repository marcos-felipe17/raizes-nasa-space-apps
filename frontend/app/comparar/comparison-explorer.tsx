"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Season = { crop: string; start_month: string; end_month: string };
type Proposal = { seasons: Season[] };
type Candidates = { status: "known" | "unknown"; crops: string[] };
type Point = { latitude: number; longitude: number };
type Inputs = { proposal: Proposal | null; candidates: Candidates; point: Point | null };
type Option = {
  kind: "proposal" | "alternative"; seasons: Season[];
  state: "excluded" | "inconclusive"; state_reason: string;
  distinct_crops: boolean; candidate_crops: "all_listed" | "some_unlisted" | "unknown";
  regional_source: "documented" | "not_documented";
  source_url: string | null; source_version: string | null; context_name: string | null;
  adequacy: "unavailable";
};
type Result = { status: "ready" | "limited"; reason: string; options: Option[]; missing_for_comparison: string[] };

function stored(key: string): unknown {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function readInputs(): Inputs {
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
  return (result.status === "ready" || result.status === "limited") &&
    typeof result.reason === "string" && Array.isArray(result.missing_for_comparison) &&
    Array.isArray(result.options) && result.options.length >= 1 && result.options.every((item) =>
      item && (item.kind === "proposal" || item.kind === "alternative") &&
      (item.state === "excluded" || item.state === "inconclusive") &&
      Array.isArray(item.seasons) && item.seasons.length === 2 &&
      item.seasons.every((season) => season && typeof season.crop === "string" &&
        typeof season.start_month === "string" && typeof season.end_month === "string") &&
      typeof item.distinct_crops === "boolean" && item.adequacy === "unavailable");
}

const candidateText = {
  all_listed: "Ambas na sua lista",
  some_unlisted: "Há cultura fora da sua lista",
  unknown: "Lista não informada",
};

export default function ComparisonExplorer() {
  const [inputs, setInputs] = useState<Inputs | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setInputs(readInputs()); }, []);

  async function compare() {
    if (!inputs?.proposal || !inputs.point) return;
    setBusy(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/comparison", {
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
    } catch { setMessage("Não foi possível comparar as opções agora. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <>
    <section className="form-card comparison-controls">
      <h2 className="form-heading">Dados da comparação</h2>
      {!inputs ? <p>Carregando rascunhos…</p> : <>
        <ul className="alternative-inputs">
          <li>{inputs.proposal ? "Proposta de duas safras registrada" : <Link href="/rotacao">Informar proposta</Link>}</li>
          <li>{inputs.point ? `Ponto aproximado: ${inputs.point.latitude.toFixed(3)}, ${inputs.point.longitude.toFixed(3)}` : <Link href="/localizacao">Informar localização</Link>}</li>
          <li>{inputs.candidates.status === "known" ? `${inputs.candidates.crops.length} culturas candidatas registradas` : <Link href="/culturas-possiveis">Informar culturas candidatas</Link>}</li>
        </ul>
        <button className="primary-button" type="button" disabled={busy || !inputs.proposal || !inputs.point}
          onClick={() => void compare()}>{busy ? "Comparando…" : "Comparar opções"}</button>
      </>}
      {message && <p className="status-message" role="alert">{message}</p>}
    </section>
    {result && <section className="comparison-results" aria-live="polite">
      <h2>Comparação</h2>
      <p className={result.status === "limited" ? "notice" : "field-hint"}>{result.reason}</p>
      {result.missing_for_comparison.includes("candidate_crops") && <p><Link href="/culturas-possiveis">Informe culturas candidatas</Link> para completar o filtro.</p>}
      {result.missing_for_comparison.includes("verified_region_rules") && <p>Nenhuma região auditada está disponível para este ponto. A proposta aparece abaixo sem alternativas geradas.</p>}
      <div className="comparison-scroll" role="region" aria-label="Opções lado a lado" tabIndex={0}>
        <table className="comparison-table">
          <thead><tr><th scope="col">Indicador</th>{result.options.map((option, index) =>
            <th scope="col" key={index}>{option.kind === "proposal" ? "Sua proposta" : `Alternativa ${index}`}</th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">Sequência</th>{result.options.map((option, index) => <td key={index}>{option.seasons.map((s) => s.crop).join(" → ")}</td>)}</tr>
            <tr><th scope="row">Períodos</th>{result.options.map((option, index) => <td key={index}>{option.seasons.map((s) => `${s.start_month} a ${s.end_month}`).join(" / ")}</td>)}</tr>
            <tr><th scope="row">Estado</th>{result.options.map((option, index) => <td key={index}><strong>{option.state === "excluded" ? "Excluída" : "Inconclusiva"}</strong><small>{option.state_reason}</small></td>)}</tr>
            <tr><th scope="row">Culturas distintas</th>{result.options.map((option, index) => <td key={index}>{option.distinct_crops ? "Sim" : "Não"}</td>)}</tr>
            <tr><th scope="row">Culturas candidatas</th>{result.options.map((option, index) => <td key={index}>{candidateText[option.candidate_crops]}</td>)}</tr>
            <tr><th scope="row">Fonte regional</th>{result.options.map((option, index) => <td key={index}>{option.regional_source === "documented" && option.source_url ? <><span>{option.context_name} · {option.source_version}</span><small><a href={option.source_url} target="_blank" rel="noopener noreferrer">Consultar fonte</a></small></> : "Não vinculada a esta opção"}</td>)}</tr>
            <tr><th scope="row">Adequação (R)</th>{result.options.map((option, index) => <td key={index}>Indisponível</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="field-hint">Indicadores descritivos não medem produtividade, saúde do solo ou economia de água. Nenhuma opção recebe classificação de melhor rotação.</p>
    </section>}
  </>;
}
