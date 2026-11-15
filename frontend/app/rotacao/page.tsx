import type { Metadata } from "next";
import Link from "next/link";
import RotationProposalForm from "./rotation-proposal-form";

export const metadata: Metadata = {
  title: "Raízes | Propor rotação",
  description: "Registre uma proposta de duas safras para avaliação posterior.",
};

export default function RotationPage() {
  return <main className="page-shell">
    <header className="page-header"><span className="brand">RAÍZES</span><span className="step">Estratégia · Proposta</span></header>
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">EXPLORAR ROTAÇÃO</p>
      <h1 id="page-title">Qual sequência você quer avaliar?</h1>
      <p>Informe duas safras na ordem planejada. Esta etapa registra sua proposta; as restrições e a adequação serão verificadas depois.</p>
    </section>
    <RotationProposalForm />
    <p className="page-link"><Link href="/restricoes">Verificar restrições →</Link></p>
  </main>;
}
