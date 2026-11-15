"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import GapsView, { GapsResult } from "./gaps-view";

type LocalDrafts = {
  soil: unknown;
  profile: unknown;
  history: unknown;
  candidate_crops: unknown;
  coverage_point: { latitude: number; longitude: number } | null;
  rotation_proposal: unknown;
};

function getDraft(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readDrafts(): LocalDrafts {
  const pointRaw = getDraft("raizes:coverage-point:v1");
  let coverage_point: { latitude: number; longitude: number } | null = null;
  if (pointRaw && typeof pointRaw === "object") {
    const candidate = pointRaw as { latitude?: unknown; longitude?: unknown };
    if (
      typeof candidate.latitude === "number" &&
      Number.isFinite(candidate.latitude) &&
      typeof candidate.longitude === "number" &&
      Number.isFinite(candidate.longitude)
    ) {
      coverage_point = {
        latitude: candidate.latitude,
        longitude: candidate.longitude,
      };
    }
  }

  return {
    soil: getDraft("raizes:soil:v1"),
    profile: getDraft("raizes:profile:v1"),
    history: getDraft("raizes:history:v1"),
    candidate_crops: getDraft("raizes:candidate-crops:v1"),
    coverage_point,
    rotation_proposal: getDraft("raizes:rotation-proposal:v1"),
  };
}

function buildCoveragePayload(drafts: LocalDrafts) {
  if (!drafts.coverage_point) return null;
  const soil = drafts.soil as { soil?: { status?: string } } | null;
  const profile = drafts.profile as {
    profile?: { water_regime?: string };
  } | null;
  const history = drafts.history as {
    history?: { periods?: unknown[] };
  } | null;
  const crops = drafts.candidate_crops as {
    candidate_crops?: { status?: string; crops?: unknown[] };
  } | null;

  return {
    latitude: drafts.coverage_point.latitude,
    longitude: drafts.coverage_point.longitude,
    soil_known: soil?.soil?.status === "known",
    water_regime_known: ["rainfed", "irrigated"].includes(
      profile?.profile?.water_regime ?? "",
    ),
    history_known: !!history?.history?.periods?.length,
    candidate_crops_known:
      crops?.candidate_crops?.status === "known" &&
      !!crops.candidate_crops.crops?.length,
  };
}

function isGapsResult(value: unknown): value is GapsResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GapsResult>;
  return (
    (candidate.status === "inconclusive" ||
      candidate.status === "no_gaps_identified") &&
    Array.isArray(candidate.gaps) &&
    Array.isArray(candidate.unverified_items) &&
    Array.isArray(candidate.evaluations) &&
    Array.isArray(candidate.regional_rules_coverage) &&
    candidate.r_score === null &&
    candidate.eligibility_evaluated === false &&
    candidate.recommendation_ready === false
  );
}

export default function GapsClient() {
  const [drafts, setDrafts] = useState<LocalDrafts | null>(null);
  const [result, setResult] = useState<GapsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function runCheck(currentDrafts: LocalDrafts) {
    setBusy(true);
    setMessage("");
    try {
      let coverage: unknown = null;
      const coveragePayload = buildCoveragePayload(currentDrafts);
      if (coveragePayload) {
        try {
          const covResponse = await fetch("/api/data-coverage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(coveragePayload),
          });
          if (covResponse.ok) {
            coverage = await covResponse.json();
          }
        } catch {
          coverage = null;
        }
      }

      const response = await fetch("/api/gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soil: currentDrafts.soil,
          profile: currentDrafts.profile,
          history: currentDrafts.history,
          candidate_crops: currentDrafts.candidate_crops,
          coverage,
          rotation_proposal: currentDrafts.rotation_proposal,
        }),
      });
      if (!response.ok) {
        setMessage("Não foi possível verificar as lacunas. Tente novamente.");
        return;
      }
      const data: unknown = await response.json();
      if (!isGapsResult(data)) {
        setMessage("A resposta de lacunas está incompleta.");
        return;
      }
      setResult(data);
    } catch {
      setMessage("Não foi possível conectar à API. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const loaded = readDrafts();
    setDrafts(loaded);
    void runCheck(loaded);
  }, []);

  function handleRefresh(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loaded = readDrafts();
    setDrafts(loaded);
    void runCheck(loaded);
  }

  return (
    <div className="content-grid">
      <form className="form-card" onSubmit={handleRefresh}>
        <h2 className="form-heading">Rascunhos lidos deste navegador</h2>
        <p className="notice">
          Dados dos rascunhos deste navegador, sem vínculo persistente com uma
          área de cultivo.
        </p>
        <p className="field-hint">
          Confira ou atualize cada etapa caso pertençam a outra área de cultivo:{" "}
          <Link href="/localizacao">localização</Link>,{" "}
          <Link href="/solo">solo</Link>,{" "}
          <Link href="/regime-hidrico">regime hídrico</Link>,{" "}
          <Link href="/historico">histórico</Link>,{" "}
          <Link href="/culturas-possiveis">culturas candidatas</Link>,{" "}
          <Link href="/cobertura">cobertura</Link> e{" "}
          <Link href="/rotacao">proposta de rotação</Link>.
        </p>

        {drafts && (
          <ul className="coverage-list">
            <li>
              <strong>Solo (raizes:soil:v1):</strong>{" "}
              {drafts.soil ? "Rascunho encontrado" : "Sem rascunho"}
            </li>
            <li>
              <strong>Perfil hídrico (raizes:profile:v1):</strong>{" "}
              {drafts.profile ? "Rascunho encontrado" : "Sem rascunho"}
            </li>
            <li>
              <strong>Histórico (raizes:history:v1):</strong>{" "}
              {drafts.history ? "Rascunho encontrado" : "Sem rascunho"}
            </li>
            <li>
              <strong>Culturas candidatas (raizes:candidate-crops:v1):</strong>{" "}
              {drafts.candidate_crops ? "Rascunho encontrado" : "Sem rascunho"}
            </li>
            <li>
              <strong>Ponto de cobertura (raizes:coverage-point:v1):</strong>{" "}
              {drafts.coverage_point
                ? `${drafts.coverage_point.latitude.toFixed(3)}, ${drafts.coverage_point.longitude.toFixed(3)}`
                : "Sem ponto salvo (consulte a cobertura em /cobertura)"}
            </li>
            <li>
              <strong>
                Proposta de rotação (raizes:rotation-proposal:v1):
              </strong>{" "}
              {drafts.rotation_proposal
                ? "Rascunho encontrado"
                : "Sem rascunho"}
            </li>
          </ul>
        )}

        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Verificando lacunas…" : "Atualizar verificação de lacunas"}
        </button>
        {message && (
          <p role="alert" className="status-message">
            {message}
          </p>
        )}
      </form>

      {result ? (
        <GapsView result={result} />
      ) : (
        <section className="summary-card" aria-live="polite">
          <h2>Diagnóstico de lacunas da área de cultivo</h2>
          <p>
            {busy
              ? "Consultando lacunas para os rascunhos atuais…"
              : "Acione a verificação para visualizar os dados ausentes e não verificados."}
          </p>
        </section>
      )}
    </div>
  );
}
