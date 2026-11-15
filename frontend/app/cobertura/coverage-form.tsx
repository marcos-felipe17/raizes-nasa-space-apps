"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type CoverageItem = { key: string; label: string; status: "available" | "missing" | "unverified"; source: string; detail: string };
type CoverageResult = { latitude: number; longitude: number; items: CoverageItem[]; recommendation_ready: false };
const labels = { available: "Disponível", missing: "Ausente", unverified: "Não verificado" };

function getDraft(key: string): unknown {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function readLocalCoverage() {
  const soil = getDraft("raizes:soil:v1") as { soil?: { status?: string } } | null;
  const profile = getDraft("raizes:profile:v1") as { profile?: { water_regime?: string } } | null;
  const history = getDraft("raizes:history:v1") as { history?: { periods?: unknown[] } } | null;
  const crops = getDraft("raizes:candidate-crops:v1") as { candidate_crops?: { status?: string; crops?: unknown[] } } | null;
  return {
    soil_known: soil?.soil?.status === "known",
    water_regime_known: ["rainfed", "irrigated"].includes(profile?.profile?.water_regime ?? ""),
    history_known: !!history?.history?.periods?.length,
    candidate_crops_known: crops?.candidate_crops?.status === "known" && !!crops.candidate_crops.crops?.length,
  };
}

function isResult(value: unknown): value is CoverageResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<CoverageResult>;
  return typeof result.latitude === "number" && typeof result.longitude === "number" &&
    Array.isArray(result.items) && result.items.every((item) =>
      typeof item.key === "string" && typeof item.label === "string" &&
      ["available", "missing", "unverified"].includes(item.status) &&
      typeof item.source === "string" && typeof item.detail === "string");
}

export default function CoverageForm() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("raizes:coverage-point:v1");
      if (raw) {
        const point: unknown = JSON.parse(raw);
        if (point && typeof point === "object") {
          const coordinates = point as { latitude?: unknown; longitude?: unknown };
          if (typeof coordinates.latitude === "number") setLatitude(String(coordinates.latitude));
          if (typeof coordinates.longitude === "number") setLongitude(String(coordinates.longitude));
        }
      }
    } catch { /* A new point can be entered. */ }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lat = Number(latitude.replace(",", "."));
    const lon = Number(longitude.replace(",", "."));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180 || !latitude.trim() || !longitude.trim()) {
      setMessage("Informe latitude entre -90 e 90 e longitude entre -180 e 180."); return;
    }
    setBusy(true); setMessage(""); setResult(null);
    try {
      const response = await fetch("/api/data-coverage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lon, ...readLocalCoverage() }),
      });
      if (!response.ok) throw new Error();
      const data: unknown = await response.json();
      if (!isResult(data)) throw new Error();
      localStorage.setItem("raizes:coverage-point:v1", JSON.stringify({ latitude: lat, longitude: lon }));
      setResult(data);
    } catch { setMessage("Não foi possível verificar a cobertura. Tente novamente."); }
    finally { setBusy(false); }
  }

  return <div className="content-grid">
    <form className="form-card" onSubmit={submit}>
      <h2 className="form-heading">Ponto aproximado</h2>
      <p className="field-hint">Use coordenadas da região da área. A consulta climática é regional e não mede sua parcela.</p>
      <div className="coverage-coordinates">
        <div className="field"><label htmlFor="latitude">Latitude</label><input id="latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Ex.: -11,86" inputMode="decimal" required /></div>
        <div className="field"><label htmlFor="longitude">Longitude</label><input id="longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Ex.: -55,51" inputMode="decimal" required /></div>
      </div>
      <button className="primary-button" type="submit" disabled={busy}>{busy ? "Consultando…" : "Verificar cobertura"}</button>
      {message && <p role="alert" className="status-message">{message}</p>}
      <p className="field-hint">Os rascunhos abaixo ainda não estão vinculados a estas coordenadas. Confirme que são da mesma área antes de usá-los. Dados informados em <Link href="/solo">solo</Link>, <Link href="/regime-hidrico">regime hídrico</Link>, <Link href="/historico">histórico</Link> e <Link href="/culturas-possiveis">culturas</Link> são lidos deste navegador.</p>
    </form>
    <section className="summary-card" aria-live="polite">
      <h2>Cobertura da área</h2>
      {!result ? <p>Informe o ponto e consulte para ver os dados disponíveis, ausentes e ainda não verificados.</p> : <>
        <p>Consulta para {result.latitude.toFixed(3)}, {result.longitude.toFixed(3)}</p>
        <ul className="coverage-list">{result.items.map((item) => <li key={item.key}>
          <span className={`coverage-status coverage-${item.status}`}>{labels[item.status]}</span>
          <strong>{item.label}</strong><small>{item.source}</small><p>{item.detail}</p>
        </li>)}</ul>
        <p className="notice">Esta verificação mostra cobertura. Ainda faltam regras agronômicas e validação para recomendar uma rotação.</p>
      </>}
    </section>
  </div>;
}
