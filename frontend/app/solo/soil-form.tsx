"use client";

import { FormEvent, useEffect, useState } from "react";

type SoilStatus = "known" | "unknown";
type SoilSource = "farmer" | "external";
type SoilPayload =
  | { status: "unknown" }
  | {
      status: "known";
      description?: string;
      classification?: string;
      source: SoilSource;
      source_reference?: string;
    };

type SoilValidation = {
  soil: SoilPayload;
  missing_for_analysis: string[];
};

const storageKey = "raizes:soil:v1";

function isSavedValidation(value: unknown): value is SoilValidation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SoilValidation>;
  return (
    !!candidate.soil &&
    typeof candidate.soil === "object" &&
    (candidate.soil.status === "known" || candidate.soil.status === "unknown") &&
    Array.isArray(candidate.missing_for_analysis)
  );
}

export default function SoilForm() {
  const [status, setStatus] = useState<SoilStatus>("unknown");
  const [description, setDescription] = useState("");
  const [classification, setClassification] = useState("");
  const [source, setSource] = useState<SoilSource>("farmer");
  const [sourceReference, setSourceReference] = useState("");
  const [saved, setSaved] = useState<SoilValidation | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const value: unknown = JSON.parse(raw);
      if (!isSavedValidation(value)) return;
      setSaved(value);
      setStatus(value.soil.status);
      if (value.soil.status === "known") {
        setDescription(value.soil.description ?? "");
        setClassification(value.soil.classification ?? "");
        setSource(value.soil.source);
        setSourceReference(value.soil.source_reference ?? "");
      }
    } catch {
      // An unreadable browser draft does not block a new entry.
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    const payload: SoilPayload =
      status === "unknown"
        ? { status: "unknown" }
        : {
            status: "known",
            ...(description.trim() ? { description: description.trim() } : {}),
            ...(classification.trim() ? { classification: classification.trim() } : {}),
            source,
            ...(source === "external" && sourceReference.trim()
              ? { source_reference: sourceReference.trim() }
              : {}),
          };

    try {
      const response = await fetch("/api/soil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setMessage("Confira os campos de solo e tente novamente.");
        return;
      }
      const result: unknown = await response.json();
      if (!isSavedValidation(result)) {
        setMessage("A resposta da validação está incompleta. Tente novamente.");
        return;
      }
      window.localStorage.setItem(storageKey, JSON.stringify(result));
      setSaved(result);
      setMessage("Informação do solo registrada neste navegador.");
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
          <legend>Você conhece o solo dessa área?</legend>
          <label className="choice">
            <input
              type="radio"
              name="soil-status"
              checked={status === "known"}
              onChange={() => setStatus("known")}
            />
            Sim, tenho informações
          </label>
          <label className="choice">
            <input
              type="radio"
              name="soil-status"
              checked={status === "unknown"}
              onChange={() => setStatus("unknown")}
            />
            Não sei
          </label>
        </fieldset>

        {status === "known" && (
          <div className="details">
            <div className="field">
              <label htmlFor="soil-description">Descrição do solo</label>
              <textarea
                id="soil-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: solo argiloso com boa drenagem"
                maxLength={500}
                rows={3}
                required={!classification.trim()}
              />
            </div>
            <div className="field">
              <label htmlFor="soil-classification">Classificação, se conhecida</label>
              <input
                id="soil-classification"
                value={classification}
                onChange={(event) => setClassification(event.target.value)}
                placeholder="Ex.: Latossolo Vermelho-Amarelo"
                maxLength={120}
              />
            </div>
            <fieldset className="choice-group compact">
              <legend>De onde vem essa informação?</legend>
              <label className="choice">
                <input
                  type="radio"
                  name="soil-source"
                  checked={source === "farmer"}
                  onChange={() => setSource("farmer")}
                />
                Informada por mim
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="soil-source"
                  checked={source === "external"}
                  onChange={() => setSource("external")}
                />
                Fonte externa
              </label>
            </fieldset>
            {source === "external" && (
              <div className="field">
                <label htmlFor="soil-reference">Qual fonte?</label>
                <input
                  id="soil-reference"
                  value={sourceReference}
                  onChange={(event) => setSourceReference(event.target.value)}
                  placeholder="Ex.: análise de solo, Embrapa, SSURGO"
                  maxLength={300}
                  required
                />
              </div>
            )}
          </div>
        )}

        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Validando…" : "Registrar solo"}
        </button>
        {message && <p className="status-message" role="status">{message}</p>}
      </form>

      <aside className="summary-card" aria-live="polite">
        <h2>Registro atual</h2>
        {saved ? (
          <>
            <p className="summary-value">
              {saved.soil.status === "unknown"
                ? "Solo ainda não informado"
                : saved.soil.classification || saved.soil.description}
            </p>
            <p>
              Origem: {saved.soil.status === "unknown"
                ? "não informada"
                : saved.soil.source === "farmer"
                  ? "agricultor"
                  : saved.soil.source_reference}
            </p>
            {saved.missing_for_analysis.includes("soil") && (
              <p className="notice">Análises que exigem dados de solo ficarão inconclusivas.</p>
            )}
          </>
        ) : (
          <p>Registre o solo para ver aqui a informação que será usada na análise.</p>
        )}
      </aside>
    </div>
  );
}
