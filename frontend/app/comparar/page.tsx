import type { Metadata } from "next";
import Link from "next/link";
import ComparisonExplorer from "./comparison-explorer";

export const metadata: Metadata = {
  title: "Raízes | Comparar opções",
  description: "Compare a proposta e as alternativas por estado, culturas, períodos e evidência.",
};

export default function ComparisonPage() {
  return <main className="page-shell">
    <header className="page-header"><span className="brand">RAÍZES</span><span className="step">Estratégia · Comparação</span></header>
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">COMPARAR OPÇÕES</p>
      <h1 id="page-title">O que muda entre as sequências?</h1>
      <p>Veja sua proposta ao lado das alternativas documentadas. Estados e indicadores mostram o que pode ser verificado agora; adequação agronômica permanece indisponível sem critérios regionais completos.</p>
    </section>
    <ComparisonExplorer />
    <p className="page-link"><Link href="/alternativas">Voltar às alternativas</Link></p>
  </main>;
}
