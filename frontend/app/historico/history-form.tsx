"use client";

import { FormEvent, useEffect, useState } from "react";

type Period = { crop: string; start_month: string; end_month: string };
type EditablePeriod = Period & { id: string };
type HistoryValidation = { history: { periods: Period[] } };

const storageKey = "raizes:history:v1";

function newPeriod(period?: Period): EditablePeriod {
  return { id: crypto.randomUUID(), crop: period?.crop ?? "", start_month: period?.start_month ?? "", end_month: period?.end_month ?? "" };
}

function isHistoryValidation(value: unknown): value is HistoryValidation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HistoryValidation>;
  return !!candidate.history && Array.isArray(candidate.history.periods) &&
    candidate.history.periods.length > 0 &&
    candidate.history.periods.every((period) =>
      period && typeof period.crop === "string" &&
      typeof period.start_month === "string" && typeof period.end_month === "string");
}

export default function HistoryForm() {
  const [periods, setPeriods] = useState<EditablePeriod[]>([]);
  const [saved, setSaved] = useState<HistoryValidation | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isHistoryValidation(parsed)) {
          setSaved(parsed);
          setPeriods(parsed.history.periods.map(newPeriod));
          return;
        }
      }
    } catch {
      // An unreadable draft does not block a new entry.
    }
    setPeriods([newPeriod()]);
  }, []);

  function update(id: string, field: keyof Period, value: string) {
    setPeriods((current) => current.map((period) =>
      period.id === id ? { ...period, [field]: value } : period));
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: Period[] = periods.map(({ crop, start_month, end_month }) => ({
      crop: crop.trim(), start_month, end_month,
    }));
    if (payload.some((period) => period.end_month < period.start_month)) {
      setMessage("O fim de cada cultivo deve ser igual ou posterior ao início.");
      return;
    }
    if (payload.some((period, index) => index > 0 && period.start_month < payload[index - 1].start_month)) {
      setMessage("Coloque os cultivos em ordem, do mais antigo para o mais novo.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periods: payload }),
      });
      if (!response.ok) {
        setMessage("Confira as culturas e os meses informados e tente novamente.");
        return;
      }
      const result: unknown = await response.json();
      if (!isHistoryValidation(result)) {
        setMessage("A resposta da validação está incompleta. Tente novamente.");
        return;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(result));
      setSaved(result);
      setMessage("Histórico registrado neste navegador.");
    } catch {
      setMessage("Não foi possível conectar à API. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content-grid">
      <form className="form-card" onSubmit={submit}>
        <h2 className="form-heading">Culturas recentes</h2>
        {periods.map((period, index) => (
          <fieldset className="history-period" key={period.id}>
            <legend>Cultivo {index + 1}</legend>
            <div className="field">
              <label htmlFor={`crop-${period.id}`}>Cultura</label>
              <input id={`crop-${period.id}`} value={period.crop}
                onChange={(event) => update(period.id, "crop", event.target.value)}
                placeholder="Ex.: soja" minLength={2} maxLength={120} required />
            </div>
            <div className="period-months">
              <div className="field">
                <label htmlFor={`start-${period.id}`}>Início</label>
                <input id={`start-${period.id}`} type="month" value={period.start_month}
                  onChange={(event) => update(period.id, "start_month", event.target.value)}
                  onInput={(event) => update(period.id, "start_month", event.currentTarget.value)} required />
              </div>
              <div className="field">
                <label htmlFor={`end-${period.id}`}>Fim</label>
                <input id={`end-${period.id}`} type="month" value={period.end_month}
                  onChange={(event) => update(period.id, "end_month", event.target.value)}
                  onInput={(event) => update(period.id, "end_month", event.currentTarget.value)} required />
              </div>
            </div>
            {periods.length > 1 && (
              <button type="button" className="text-button" onClick={() =>
                setPeriods((current) => current.filter((item) => item.id !== period.id))}>
                Remover cultivo {index + 1}
              </button>
            )}
          </fieldset>
        ))}
        <button type="button" className="secondary-button"
          disabled={periods.length >= 20}
          onClick={() => setPeriods((current) => [...current, newPeriod()])}>
          Adicionar cultivo
        </button>
        <button className="primary-button" type="submit" disabled={busy || periods.length === 0}>
          {busy ? "Validando…" : "Registrar histórico"}
        </button>
        {message && <p className="status-message" role="status">{message}</p>}
      </form>

      <aside className="summary-card" aria-live="polite">
        <h2>Histórico registrado</h2>
        {saved ? (
          <ol className="history-summary">
            {saved.history.periods.map((period, index) => (
              <li key={`${period.start_month}-${index}`}>
                <strong>{period.crop}</strong>
                <span>{period.start_month} a {period.end_month}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p>Os cultivos e seus períodos aparecerão aqui após a validação.</p>
        )}
      </aside>
    </div>
  );
}
