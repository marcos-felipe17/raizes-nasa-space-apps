import type { Metadata } from "next";
import Link from "next/link";
import WaterRegimeForm from "./water-regime-form";

export const metadata: Metadata = {
  title: "Raízes | Regime hídrico da área",
  description: "Informe se o cultivo desta área é de sequeiro ou irrigado.",
};

export default function WaterRegimePage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="brand">RAÍZES</span>
        <span className="step">Perfil da área · Água</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">CONHECER A ÁREA</p>
        <h1 id="page-title">Como essa área recebe água?</h1>
        <p>
          Escolha o regime usado no cultivo desta área. Essa informação fará parte do
          perfil e ajudará a evitar comparações com áreas de manejo diferente.
        </p>
      </section>
      <WaterRegimeForm />
      <p className="page-link"><Link href="/solo">Voltar ao solo</Link> · <Link href="/historico">Registrar histórico →</Link></p>
    </main>
  );
}
