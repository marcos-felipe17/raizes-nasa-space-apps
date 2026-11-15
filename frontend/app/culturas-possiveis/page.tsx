import type { Metadata } from "next";
import Link from "next/link";
import CandidateCropsForm from "./candidate-crops-form";

export const metadata: Metadata = {
  title: "Raízes | Culturas candidatas",
  description: "Informe as culturas que podem ser consideradas para sua área.",
};

export default function CandidateCropsPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="brand">RAÍZES</span>
        <span className="step">Perfil da área · Culturas</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">CONHECER A ÁREA</p>
        <h1 id="page-title">Quais culturas você pode considerar?</h1>
        <p>
          Liste as culturas que estão ao seu alcance para esta área. O Raízes ainda
          precisará verificar se cada uma é adequada ao solo, à água e ao local.
        </p>
      </section>
      <CandidateCropsForm />
      <p className="page-link"><Link href="/cobertura">Ver cobertura de dados →</Link></p>
    </main>
  );
}
