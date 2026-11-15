"use client";

import { FormEvent, useEffect, useState } from "react";

type Status = "known" | "unknown";
type EditableCrop = { id: string; name: string };
type CandidateCropsValidation = {
  candidate_crops: { status: Status; crops: string[] };
  eligibility_evaluated: false;
  missing_for_analysis: string[];
};

const storageKey = "raizes:candidate-crops:v1";

function newCrop(name = ""): EditableCrop {
  return { id: crypto.randomUUID(), name };
}

function isValidation(value: unknown): value is CandidateCropsValidation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CandidateCropsValidation>;
  const crops = candidate.candidate_crops;
  return !!crops && (crops.status === "known" || crops.status === "unknown") &&
    Array.isArray(crops.crops) && crops.crops.every((crop) => typeof crop === "string") &&
    candidate.eligibility_evaluated === false &&
    Array.isArray(candidate.missing_for_analysis);
}

export default function CandidateCropsForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [crops, setCrops] = useState<EditableCrop[]>([]);
  const [saved, setSaved] = useState<CandidateCropsValidation | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isValidation(parsed)) {
          setSaved(parsed);
          setStatus(parsed.candidate_crops.status);
          setCrops(parsed.candidate_crops.crops.length
            ? parsed.candidate_crops.crops.map(newCrop) : [newCrop()]);
          return;
        }
      }
    } catch {
      // An unreadable draft does not prevent a new entry.
    }
    setCrops([newCrop()]);
  }, []);

  function update(id: string, name: string) {
    setCrops((current) => current.map((crop) => crop.id === id ? { ...crop, name } : crop));
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status) {
      setMessage("Escolha se você conhece as culturas que pode considerar.");
      return;
    }
    const names = status === "known" ? crops.map((crop) => crop.name.trim()) : [];
    if (status === "known" && new Set(names.map((name) => name.toLocaleLowerCase("pt-BR"))).size !== names.length) {
      setMessage("Remova as culturas repetidas antes de registrar.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/candidate-crops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, crops: names }),
      });
      if (!response.ok) {
        setMessage("Confira os nomes das culturas e tente novamente.");
        return;
      }
      const result: unknown = await response.json();
      if (!isValidation(result)) {
        setMessage("A resposta da validação está incompleta. Tente novamente.");
        return;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(result));
      setSaved(result);
      setMessage("Culturas candidatas registradas neste navegador.");
    } catch {
      setMessage("Não foi possível conectar à API. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content-grid">
      <form className="form-card" onSubmit={submit}>
        <fieldset className="choice-group">
          <legend>Você já sabe quais culturas pode considerar?</legend>
          <label className="choice">
            <input type="radio" name="candidate-status" checked={status === "known"}
              onChange={() => setStatus("known")} required />
            Sim, vou informar
          </label>
          <label className="choice">
            <input type="radio" name="candidate-status" checked={status === "unknown"}
              onChange={() => setStatus("unknown")} required />
            Ainda não sei
          </label>
        </fieldset>

        {status === "known" && (
          <div className="details">
            <div className="candidate-list">
              {crops.map((crop, index) => (
                <div className="candidate-row" key={crop.id}>
                  <div className="field">
                    <label htmlFor={`candidate-${crop.id}`}>Cultura {index + 1}</label>
                    <input id={`candidate-${crop.id}`} value={crop.name}
                      onChange={(event) => update(crop.id, event.target.value)}
                      placeholder="Ex.: soja" minLength={2} maxLength={120} required />
                  </div>
                  {crops.length > 1 && (
                    <button className="text-button" type="button" onClick={() =>
                      setCrops((current) => current.filter((item) => item.id !== crop.id))}>
                      Remover cultura {index + 1}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="secondary-button" type="button" disabled={crops.length >= 30}
              onClick={() => setCrops((current) => [...current, newCrop()])}>
              Adicionar cultura
            </button>
          </div>
        )}

        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Validando…" : "Registrar culturas"}
        </button>
        {message && <p className="status-message" role="status">{message}</p>}
      </form>

      <aside className="summary-card" aria-live="polite">
        <h2>Culturas candidatas</h2>
        {saved ? saved.candidate_crops.status === "unknown" ? (
          <p>Lista ainda não informada. Essa lacuna limita as alternativas que podem ser propostas.</p>
        ) : (
          <>
            <ul className="candidate-summary">
              {saved.candidate_crops.crops.map((crop) => <li key={crop}>{crop}</li>)}
            </ul>
            <p className="notice">Essas culturas ainda não foram avaliadas quanto à adequação para a área.</p>
          </>
        ) : <p>Registre as culturas para vê-las aqui como opções a avaliar.</p>}
      </aside>
    </div>
  );
}
