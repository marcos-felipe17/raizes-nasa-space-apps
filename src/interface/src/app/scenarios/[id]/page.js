"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { texts } from "../../../i18n/pt-BR";
import {
  fetchScenarioById,
  formatField,
  formatWaterRegime,
} from "../../../services/api";

export default function ScenarioDetailPage() {
  const params = useParams();
  const scenarioId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [scenario, setScenario] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadScenario = useCallback(async () => {
    if (!scenarioId) {
      return;
    }
    setLoading(true);
    setError(false);
    setNotFound(false);
    try {
      const result = await fetchScenarioById(scenarioId);
      if (result.notFound) {
        setNotFound(true);
        setScenario(null);
      } else {
        setScenario(result.scenario);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [scenarioId]);

  useEffect(() => {
    loadScenario();
  }, [loadScenario]);

  if (loading) {
    return (
      <div className="status-box" role="status">
        <p>{texts.loadingScenarioDetail}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link href="/" className="back-link">
          &larr; {texts.backToHome}
        </Link>
        <div className="error-box" role="alert">
          <h2>{texts.apiErrorTitle}</h2>
          <p>{texts.apiErrorDescription}</p>
          <button type="button" className="retry-button" onClick={loadScenario}>
            {texts.retryButton}
          </button>
        </div>
      </div>
    );
  }

  if (notFound || !scenario) {
    return (
      <div className="status-box" role="alert">
        <h2>{texts.scenarioNotFound}</h2>
        <p>{texts.scenarioNotFoundDescription}</p>
        <Link href="/" className="primary-link">
          {texts.backToHome}
        </Link>
      </div>
    );
  }

  const historico = Array.isArray(scenario.historico) ? scenario.historico : [];
  const culturasPossiveis = Array.isArray(scenario.culturas_possiveis)
    ? scenario.culturas_possiveis
    : [];

  return (
    <section>
      <Link href="/" className="back-link">
        &larr; {texts.backToHome}
      </Link>

      <div className="warning-banner" role="note">
        {texts.simulatedWarning}
      </div>

      <article className="detail-card">
        <div className="card-top">
          <h2 className="card-title" style={{ fontSize: "1.4rem" }}>
            {formatField(scenario.nome)}
          </h2>
          {scenario.simulado && (
            <span className="badge-simulated">{texts.simulatedBadge}</span>
          )}
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">
              {texts.labels.approximateRegion}
            </span>
            <p className="detail-value">
              {formatField(scenario.regiao_aproximada)}
            </p>
          </div>

          <div className="detail-item">
            <span className="detail-label">{texts.labels.soil}</span>
            <p className="detail-value">{formatField(scenario.solo)}</p>
          </div>

          <div className="detail-item">
            <span className="detail-label">{texts.labels.waterRegime}</span>
            <p className="detail-value">
              {formatWaterRegime(scenario.regime_hidrico)}
            </p>
          </div>

          <div className="detail-item">
            <span className="detail-label">{texts.labels.priority}</span>
            <p className="detail-value">{formatField(scenario.prioridade)}</p>
          </div>
        </div>

        <div className="list-section">
          <span className="detail-label">{texts.labels.cropHistory}</span>
          {historico.length === 0 ? (
            <p className="detail-value">{texts.notInformed}</p>
          ) : (
            <ul className="list-items">
              {historico.map((item, idx) => (
                <li key={idx}>
                  <strong>{texts.labels.crop}:</strong>{" "}
                  {formatField(item?.cultura)} &mdash;{" "}
                  <strong>{texts.labels.period}:</strong>{" "}
                  {formatField(item?.periodo)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="list-section">
          <span className="detail-label">{texts.labels.candidateCrops}</span>
          {culturasPossiveis.length === 0 ? (
            <p className="detail-value">{texts.notInformed}</p>
          ) : (
            <ul className="list-items">
              {culturasPossiveis.map((cultura, idx) => (
                <li key={idx}>{formatField(cultura)}</li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </section>
  );
}
