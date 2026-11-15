"use client";

import { FormEvent, useEffect, useState } from "react";

type WaterRegime = "rainfed" | "irrigated";
type SoilInput =
  | { status: "unknown" }
  | {
      status: "known";
      description?: string;
      classification?: string;
      source: "farmer" | "external";
      source_reference?: string;
    };
type ProfileValidation = {
  profile: { soil: SoilInput; water_regime: WaterRegime };
  missing_for_analysis: string[];
};

const soilStorageKey = "raizes:soil:v1";
const profileStorageKey = "raizes:profile:v1";

function isSoilInput(value: unknown): value is SoilInput {
  if (!value || typeof value !== "object") return false;
  const soil = value as Partial<SoilInput>;
  return soil.status === "unknown" || (
    soil.status === "known" &&
    (soil.source === "farmer" || soil.source === "external") &&
    (typeof soil.description === "string" || typeof soil.classification === "string")
  );
}

function isProfileValidation(value: unknown): value is ProfileValidation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProfileValidation>;
  return !!candidate.profile &&
    isSoilInput(candidate.profile.soil) &&
    (candidate.profile.water_regime === "rainfed" ||
      candidate.profile.water_regime === "irrigated") &&
    Array.isArray(candidate.missing_for_analysis);
}

function getSoilDraft(): SoilInput {
  try {
    const raw = window.localStorage.getItem(soilStorageKey);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && "soil" in parsed &&
          isSoilInput(parsed.soil)) return parsed.soil;
    }
  } catch {
    // An unreadable draft is treated as missing soil information.
  }
  return { status: "unknown" };
}

export default function WaterRegimeForm() {
  const [regime, setRegime] = useState<WaterRegime | null>(null);
  const [saved, setSaved] = useState<ProfileValidation | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(profileStorageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!isProfileValidation(parsed)) return;
      setSaved(parsed);
      setRegime(parsed.profile.water_regime);
    } catch {
      // An unreadable draft does not block a new entry.
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!regime) return;
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soil: getSoilDraft(), water_regime: regime }),
      });
      if (!response.ok) {
        setMessage("Confira o regime hídrico e tente novamente.");
        return;
      }
      const result: unknown = await response.json();
      if (!isProfileValidation(result)) {
        setMessage("A resposta da validação está incompleta. Tente novamente.");
        return;
      }
      window.localStorage.setItem(profileStorageKey, JSON.stringify(result));
      setSaved(result);
      setMessage("Regime hídrico registrado neste navegador.");
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
          <legend>Regime hídrico desta área</legend>
          <label className="choice">
            <input type="radio" name="water-regime" value="rainfed"
              checked={regime === "rainfed"} onChange={() => setRegime("rainfed")}
              required />
            <span><strong>Sequeiro</strong><small>O cultivo depende da chuva, sem irrigação planejada.</small></span>
          </label>
          <label className="choice">
            <input type="radio" name="water-regime" value="irrigated"
              checked={regime === "irrigated"} onChange={() => setRegime("irrigated")}
              required />
            <span><strong>Irrigado</strong><small>O cultivo recebe água por um sistema de irrigação.</small></span>
          </label>
        </fieldset>
        <p className="field-hint">
          Se a propriedade tem áreas com regimes diferentes, preencha um perfil para cada área.
        </p>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Validando…" : "Registrar regime hídrico"}
        </button>
        {message && <p className="status-message" role="status">{message}</p>}
      </form>

      <aside className="summary-card" aria-live="polite">
        <h2>Perfil validado</h2>
        {saved ? (
          <>
            <p className="summary-value">
              {saved.profile.water_regime === "rainfed" ? "Sequeiro" : "Irrigado"}
            </p>
            <p>Solo: {saved.profile.soil.status === "unknown" ? "não informado" : "informado"}</p>
            {saved.missing_for_analysis.includes("soil") && (
              <p className="notice">O solo precisa ser informado para análises que dependem dele.</p>
            )}
          </>
        ) : (
          <p>Selecione o regime para vê-lo no perfil desta área.</p>
        )}
      </aside>
    </div>
  );
}
