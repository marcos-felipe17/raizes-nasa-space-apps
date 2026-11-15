"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { texts } from "../i18n/pt-BR";
import { fetchScenarios, formatField } from "../services/api";

export default function HomePage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchScenarios();
      setScenarios(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  if (loading) {
    return (
      <div className="status-box" role="status">
        <p>{texts.loadingScenarios}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box" role="alert">
        <h2>{texts.apiErrorTitle}</h2>
        <p>{texts.apiErrorDescription}</p>
        <button type="button" className="retry-button" onClick={loadScenarios}>
          {texts.retryButton}
        </button>
      </div>
    );
  }

  return (
    <section>
      <h2 className="section-heading">{texts.selectScenarioHeading}</h2>
      <div className="cards-grid">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="card">
            <div>
              <div className="card-top">
                <h3 className="card-title">{formatField(scenario.nome)}</h3>
                {scenario.simulado && (
                  <span className="badge-simulated">
                    {texts.simulatedBadge}
                  </span>
                )}
              </div>
              <p className="meta-line" style={{ marginTop: "0.75rem" }}>
                <span className="meta-label">
                  {texts.labels.approximateRegion}:{" "}
                </span>
                {formatField(scenario.regiao_aproximada)}
              </p>
            </div>
            <Link
              href={`/scenarios/${encodeURIComponent(scenario.id)}`}
              className="primary-link"
            >
              {texts.viewDetailsLink}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
