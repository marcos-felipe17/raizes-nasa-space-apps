import type { Metadata } from "next";
import Link from "next/link";
import GapsClient from "./gaps-client";

export const metadata: Metadata = {
  title: "Raízes | Lacunas da análise",
  description:
    "Veja quais dados faltam ou não foram verificados para entender quando a análise fica inconclusiva.",
};

export default function GapsPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="brand">RAÍZES</span>
        <span className="step">Diagnóstico · Lacunas</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">APOIO À DECISÃO</p>
        <h1 id="page-title">Quais dados faltam para avaliar esta área de cultivo?</h1>
        <p>
          Dados insuficientes são uma resposta: veja o que falta ou não pôde ser
          verificado antes de comparar alternativas para explorar. Esta etapa
          não declara nenhuma opção como elegível nem calcula R.
        </p>
      </section>
      <GapsClient />
      <p className="page-link">
        <Link href="/rotacao">← Voltar à proposta de rotação</Link> ·{" "}
        <Link href="/cobertura">Ver cobertura em /cobertura</Link>
      </p>
    </main>
  );
}
