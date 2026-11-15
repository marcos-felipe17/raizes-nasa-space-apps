"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Season = { crop: string; start_month: string; end_month: string };
type Proposal = { seasons: Season[] };
type Criterion = {
  rule_id: string; outcome: "violated" | "passed"; reason: string;
  scope: string; source: string; source_urls: string[];
};
type Explanation = {
  status: "excluded" | "inconclusive"; conclusion: string;
  criteria: Criterion[]; restrictions: Criterion[]; uncertainties: string[];
  missing_for_conclusion: string[]; next_steps: string[]; indicator_r: null;
};

function readProposal(): Proposal | null {
  try {
    const raw = localStorage.getItem("raizes:rotation-proposal:v1");
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const seasons = (value as { proposal?: { seasons?: unknown } }).proposal?.seasons;
    if (!Array.isArray(seasons) || seasons.length !== 2 || !seasons.every((item) =>
      item && typeof item.crop === "string" && typeof item.start_month === "string" &&
      typeof item.end_month === "string")) return null;
    return { seasons: seasons as Season[] };
  } catch { return null; }
}

function isCriterion(value: unknown): value is Criterion {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Criterion>;
  return typeof item.rule_id === "string" &&
    (item.outcome === "passed" || item.outcome === "violated") &&
    typeof item.reason === "string" && typeof item.scope === "string" &&
    typeof item.source === "string" && Array.isArray(item.source_urls) &&
    item.source_urls.every((url) => typeof url === "string");
}

function isExplanation(value: unknown): value is Explanation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Explanation>;
  return (item.status === "excluded" || item.status === "inconclusive") &&
    typeof item.conclusion === "string" && Array.isArray(item.criteria) &&
    item.criteria.every(isCriterion) && Array.isArray(item.restrictions) &&
    item.restrictions.every(isCriterion) && Array.isArray(item.uncertainties) &&
    item.uncertainties.every((text) => typeof text === "string") &&
    Array.isArray(item.missing_for_conclusion) && Array.isArray(item.next_steps) &&
    item.next_steps.every((text) => typeof text === "string") && item.indicator_r === null;
}

export default function ExplanationView() {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [result, setResult] = useState<Explanation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setProposal(readProposal()); }, []);

  async function explain() {
    if (!proposal) return;
    setBusy(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/explanation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal }),
      });
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (!isExplanation(data)) throw new Error();
      setResult(data);
    } catch { setMessage("Não foi possível explicar a proposta agora. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <div className="content-grid">
    <section className="form-card">
      <h2 className="form-heading">Sua proposta</h2>
      {proposal ? <>
        <ol className="history-summary">{proposal.seasons.map((season, index) => <li key={index}>
          <strong>{season.crop}</strong><span>{season.start_month} a {season.end_month}</span>
        </li>)}</ol>
        <button className="primary-button" type="button" disabled={busy} onClick={() => void explain()}>
          {busy ? "Analisando…" : "Explicar resultado"}
        </button>
      </> : <p>Registre primeiro uma proposta em <Link href="/rotacao">Propor rotação</Link>.</p>}
      {message && <p className="status-message" role="alert">{message}</p>}
    </section>
    <section className="summary-card" aria-live="polite">
      <h2>Explicação</h2>
      {!result ? <p>Critérios, restrições e incertezas aparecerão aqui após a análise.</p> : <>
        <p className={result.status === "excluded" ? "notice" : "field-hint"}>
          <strong>{result.status === "excluded" ? "Excluída como rotação" : "Inconclusiva"}</strong><br />{result.conclusion}</p>
        <h3>Critérios verificados</h3>
        {result.criteria.map((criterion) => <article className="restriction-rule" key={criterion.rule_id}>
          <h4>{criterion.outcome === "violated" ? "Não atendido" : "Atendido"}</h4>
          <p>{criterion.reason}</p><p><small>{criterion.scope}</small></p>
          <p><strong>Fonte:</strong> {criterion.source}</p>
          <ul>{criterion.source_urls.map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">Consultar documento</a></li>)}</ul>
        </article>)}
        <h3>Restrições encontradas</h3>
        {result.restrictions.length ? <ul>{result.restrictions.map((rule) => <li key={rule.rule_id}>{rule.reason}</li>)}</ul>
          : <p>Nenhuma na regra estrutural verificada. Isso não comprova adequação local.</p>}
        <h3>Incertezas e limites</h3>
        <ul>{result.uncertainties.map((item) => <li key={item}>{item}</li>)}</ul>
        <p><strong>Adequação (R):</strong> indisponível</p>
        <h3>Próximos passos</h3>
        <ul>{result.next_steps.map((item) => <li key={item}>{item}</li>)}</ul>
      </>}
    </section>
  </div>;
}
