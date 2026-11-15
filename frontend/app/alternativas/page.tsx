import type { Metadata } from "next";
import Link from "next/link";
import AlternativesExplorer from "./alternatives-explorer";

export const metadata: Metadata = {
  title: "Raízes | Alternativas para explorar",
  description: "Gere alternativas apenas quando houver regras regionais verificadas.",
};

export default function AlternativesPage() {
  return <main className="page-shell">
    <header className="page-header"><span className="brand">RAÍZES</span><span className="step">Estratégia · Alternativas</span></header>
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">EXPLORAR OPÇÕES</p>
      <h1 id="page-title">Outras sequências para explorar</h1>
      <p>O Raízes só apresenta sequências registradas em um contexto regional auditado, com culturas que você informou como candidatas. Cada opção conserva sua fonte e seus períodos; nenhuma é uma recomendação de plantio.</p>
    </section>
    <AlternativesExplorer />
    <p className="page-link"><Link href="/restricoes">Voltar à verificação da proposta</Link></p>
  </main>;
}
