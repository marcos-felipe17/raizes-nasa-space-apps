"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Season = { crop: string; start_month: string; end_month: string };
type Proposal = { seasons: Season[] };
type RuleCheck = {
  rule_id: string;
  outcome: "violated" | "passed";
  reason: string;
  source: string;
  source_urls: string[];
  scope: string;
};
type Result = {
  status: "excluded" | "inconclusive";
  reason: string;
  checked_rules: RuleCheck[];
  missing_for_conclusion: string[];
};

function readProposal(): Proposal | null {
  try {
    const raw = localStorage.getItem("raizes:rotation-proposal:v1");
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const candidate = value as { proposal?: { seasons?: unknown } };
    const seasons = candidate.proposal?.seasons;
    if (!Array.isArray(seasons) || seasons.length !== 2 || !seasons.every((item) =>
      item && typeof item.crop === "string" && typeof item.start_month === "string" &&
      typeof item.end_month === "string")) return null;
    return { seasons: seasons as Season[] };
  } catch { return null; }
}

function isResult(value: unknown): value is Result {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<Result>;
  return (result.status === "excluded" || result.status === "inconclusive") &&
    typeof result.reason === "string" && Array.isArray(result.missing_for_conclusion) &&
    Array.isArray(result.checked_rules) && result.checked_rules.every((rule) =>
      rule && typeof rule.rule_id === "string" &&
      (rule.outcome === "violated" || rule.outcome === "passed") &&
      typeof rule.reason === "string" && typeof rule.source === "string" &&
      Array.isArray(rule.source_urls) && typeof rule.scope === "string");
}

export default function RestrictionCheck() {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { setProposal(readProposal()); }, []);

  async function check() {
    if (!proposal) return;
    setBusy(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/restrictions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal }),
      });
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (!isResult(data)) throw new Error();
      setResult(data);
    } catch { setMessage("Não foi possível verificar a proposta agora. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <div className="content-grid">
    <section className="form-card">
      <h2 className="form-heading">Sua proposta</h2>
      {proposal ? <>
        <ol className="history-summary">{proposal.seasons.map((season, index) => <li key={index}>
          <strong>{season.crop}</strong><span>{season.start_month} a {season.end_month}</span>
        </li>)}</ol>
        <button className="primary-button" type="button" disabled={busy} onClick={() => void check()}>
          {busy ? "Verificando…" : "Verificar restrições"}
        </button>
        <p className="field-hint">A proposta é um rascunho deste navegador e ainda não está vinculada a uma área persistente.</p>
      </> : <p>Registre primeiro uma proposta de duas safras em <Link href="/rotacao">Propor rotação</Link>.</p>}
      {message && <p className="status-message" role="alert">{message}</p>}
    </section>
    <section className="summary-card" aria-live="polite">
      <h2>Resultado da verificação</h2>
      {!result ? <p>A regra e o motivo aparecerão aqui após a verificação.</p> : <>
        <p className={result.status === "excluded" ? "notice" : "field-hint"}>
          <strong>{result.status === "excluded" ? "Descartada como rotação" : "Inconclusiva"}</strong><br />{result.reason}
        </p>
        {result.checked_rules.map((rule) => <article className="restriction-rule" key={rule.rule_id}>
          <h3>{rule.outcome === "violated" ? "Regra violada" : "Regra atendida"}</h3>
          <p>{rule.reason}</p>
          <p><strong>Fonte:</strong> {rule.source}</p>
          <ul>{rule.source_urls.map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">Consultar documento original</a></li>)}</ul>
          <p><small>{rule.scope}</small></p>
        </article>)}
        {result.status === "inconclusive" && <p className="notice">Ainda faltam regras regionais verificadas. O Raízes não considera esta proposta aprovada.</p>}
      </>}
    </section>
  </div>;
}
