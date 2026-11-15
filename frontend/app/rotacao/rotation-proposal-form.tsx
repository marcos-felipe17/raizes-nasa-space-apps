"use client";

import { FormEvent, useEffect, useState } from "react";

type Season = { crop: string; start_month: string; end_month: string };
type Validation = { proposal: { seasons: Season[] }; analysis_performed: false };

const storageKey = "raizes:rotation-proposal:v1";
const emptySeason = (): Season => ({ crop: "", start_month: "", end_month: "" });

function isValidation(value: unknown): value is Validation {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<Validation>;
  return result.analysis_performed === false && Array.isArray(result.proposal?.seasons) &&
    result.proposal.seasons.length === 2 && result.proposal.seasons.every((season) =>
      season && typeof season.crop === "string" &&
      typeof season.start_month === "string" && typeof season.end_month === "string");
}

function readCandidateNames(): string[] {
  try {
    const raw = localStorage.getItem("raizes:candidate-crops:v1");
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return [];
    const candidate = value as { candidate_crops?: { status?: unknown; crops?: unknown } };
    if (candidate.candidate_crops?.status !== "known" || !Array.isArray(candidate.candidate_crops.crops)) return [];
    return candidate.candidate_crops.crops.filter((crop): crop is string => typeof crop === "string");
  } catch { return []; }
}

export default function RotationProposalForm() {
  const [seasons, setSeasons] = useState<Season[]>([emptySeason(), emptySeason()]);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [saved, setSaved] = useState<Validation | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCandidates(readCandidateNames());
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const value: unknown = JSON.parse(raw);
      if (isValidation(value)) { setSaved(value); setSeasons(value.proposal.seasons); }
    } catch { /* A damaged local draft does not block a new proposal. */ }
  }, []);

  function update(index: number, field: keyof Season, value: string) {
    setSeasons((current) => current.map((season, position) =>
      position === index ? { ...season, [field]: value } : season));
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const proposal = seasons.map((season) => ({ ...season, crop: season.crop.trim() }));
    if (proposal.some((season) => season.end_month < season.start_month)) {
      setMessage("O fim de cada safra deve ser igual ou posterior ao início."); return;
    }
    if (proposal[1].start_month <= proposal[0].start_month) {
      setMessage("A segunda safra precisa começar depois da primeira."); return;
    }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/rotation-proposal", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasons: proposal }),
      });
      if (!response.ok) { setMessage("Confira as culturas e os períodos informados."); return; }
      const data: unknown = await response.json();
      if (!isValidation(data)) { setMessage("A resposta da validação está incompleta."); return; }
      localStorage.setItem(storageKey, JSON.stringify(data));
      setSaved(data);
      setMessage("Proposta registrada neste navegador.");
    } catch { setMessage("Não foi possível conectar à API. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <div className="content-grid">
    <form className="form-card" onSubmit={submit}>
      <h2 className="form-heading">Duas safras, na ordem planejada</h2>
      {candidates.length > 0 && <p className="field-hint">Suas culturas candidatas aparecem como sugestões. Você também pode propor outra cultura; ela ainda precisará ser avaliada.</p>}
      <datalist id="candidate-crop-options">{candidates.map((crop) => <option key={crop} value={crop} />)}</datalist>
      {seasons.map((season, index) => <fieldset className="history-period" key={index}>
        <legend>Safra {index + 1}</legend>
        <div className="field"><label htmlFor={`rotation-crop-${index}`}>Cultura</label>
          <input id={`rotation-crop-${index}`} list="candidate-crop-options" value={season.crop}
            onChange={(event) => update(index, "crop", event.target.value)}
            placeholder="Ex.: soja" minLength={2} maxLength={120} required /></div>
        <div className="period-months">
          <div className="field"><label htmlFor={`rotation-start-${index}`}>Início</label>
            <input id={`rotation-start-${index}`} type="month" value={season.start_month}
              onChange={(event) => update(index, "start_month", event.target.value)} required /></div>
          <div className="field"><label htmlFor={`rotation-end-${index}`}>Fim</label>
            <input id={`rotation-end-${index}`} type="month" value={season.end_month}
              onChange={(event) => update(index, "end_month", event.target.value)} required /></div>
        </div>
      </fieldset>)}
      <button className="primary-button" type="submit" disabled={busy}>{busy ? "Validando…" : "Registrar proposta"}</button>
      {message && <p role="status" className="status-message">{message}</p>}
    </form>
    <aside className="summary-card" aria-live="polite">
      <h2>Proposta registrada</h2>
      {saved ? <>
        <ol className="history-summary">{saved.proposal.seasons.map((season, index) => <li key={index}>
          <strong>{season.crop}</strong><span>{season.start_month} a {season.end_month}</span>
        </li>)}</ol>
        <p className="notice">Sequência registrada, ainda sem análise de restrições ou adequação.</p>
      </> : <p>As duas safras aparecerão aqui após a validação.</p>}
    </aside>
  </div>;
}
