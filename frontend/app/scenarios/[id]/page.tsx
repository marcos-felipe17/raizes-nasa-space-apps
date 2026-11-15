"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isScenario, Scenario } from "../../../lib/scenarios";

export default function ScenarioDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch(`/api/scenarios/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (response.status === 404) { setState("missing"); return; }
      if (!response.ok) throw new Error("API indisponível");
      const data: unknown = await response.json();
      if (!isScenario(data)) throw new Error("Resposta inválida");
      setScenario(data);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="page-shell">
      <header className="page-header"><span className="brand">RAÍZES</span><span className="step">Cenário simulado</span></header>
      <p className="page-link"><Link href="/">← Voltar aos cenários</Link></p>
      {state === "loading" && <p role="status">Carregando cenário…</p>}
      {state === "missing" && <section className="form-card" role="alert"><h1>Cenário não encontrado</h1><p>Este cenário não está na base de demonstração.</p></section>}
      {state === "error" && <section className="form-card" role="alert"><h1>Não foi possível carregar o cenário.</h1><button type="button" className="secondary-button" onClick={() => void load()}>Tentar novamente</button></section>}
      {state === "ready" && scenario && (
        <>
          <section className="intro scenario-intro" aria-labelledby="scenario-title">
            <p className="eyebrow">DEMONSTRAÇÃO</p>
            <h1 id="scenario-title">{scenario.name}</h1>
            <p>{scenario.approximate_region}</p>
          </section>
          <p className="notice scenario-warning">Cenário simulado — não é recomendação agronômica. Todos os dados desta página são fictícios.</p>
          <dl className="scenario-details">
            <div><dt>Solo</dt><dd>{scenario.soil.status === "unknown" ? "não informado" : scenario.soil.classification || scenario.soil.description}</dd></div>
            <div><dt>Regime hídrico</dt><dd>{scenario.water_regime === "rainfed" ? "Sequeiro" : "Irrigado"}</dd></div>
            <div><dt>Prioridade</dt><dd>{scenario.priority || "não informado"}</dd></div>
            <div><dt>Culturas possíveis</dt><dd>{scenario.possible_crops.length ? scenario.possible_crops.join(", ") : "não informado"}</dd></div>
          </dl>
          <section className="scenario-history">
            <h2>Histórico de cultivo</h2>
            {scenario.history?.periods.length ? <ol className="history-summary">
              {scenario.history.periods.map((period, index) => <li key={`${period.start_month}-${index}`}><strong>{period.crop}</strong><span>{period.start_month} a {period.end_month}</span></li>)}
            </ol> : <p>não informado</p>}
          </section>
        </>
      )}
    </main>
  );
}
