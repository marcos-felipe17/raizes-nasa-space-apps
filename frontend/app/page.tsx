"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { isScenario, Scenario } from "../lib/scenarios";

export default function HomePage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/scenarios", { cache: "no-store" });
      if (!response.ok) throw new Error("API indisponível");
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Resposta inválida");
      setScenarios(data.filter(isScenario));
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="brand">RAÍZES</span>
        <span className="step">Explorar cenários</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">DEMONSTRAÇÃO</p>
        <h1 id="page-title">Escolha uma área simulada</h1>
        <p>Explore um exemplo fictício sem cadastrar uma fazenda. Os dados destes cenários não representam propriedades reais.</p>
      </section>
      {state === "loading" && <p role="status">Carregando cenários…</p>}
      {state === "error" && (
        <div className="form-card" role="alert">
          <h2>Não foi possível carregar os cenários.</h2>
          <p>Verifique a conexão com a API e tente novamente.</p>
          <button className="secondary-button" type="button" onClick={() => void load()}>Tentar novamente</button>
        </div>
      )}
      {state === "ready" && (
        scenarios.length ? <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <article className="scenario-card" key={scenario.id}>
              <span className="simulated-badge">Simulado</span>
              <h2>{scenario.name}</h2>
              <p>{scenario.approximate_region}</p>
              <Link href={`/scenarios/${encodeURIComponent(scenario.id)}`}>Ver cenário →</Link>
            </article>
          ))}
        </div> : <p role="status">Nenhum cenário simulado disponível.</p>
      )}
    </main>
  );
}
