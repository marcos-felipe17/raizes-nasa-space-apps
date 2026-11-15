import type { Metadata } from "next";
import Link from "next/link";
import CoverageForm from "./coverage-form";

export const metadata: Metadata = {
  title: "Raízes | Cobertura de dados",
  description: "Confira os dados disponíveis e as lacunas para sua área.",
};

export default function CoveragePage() {
  return <main className="page-shell">
    <header className="page-header"><span className="brand">RAÍZES</span><span className="step">Perfil da área · Cobertura</span></header>
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">CONHECER A ÁREA</p>
      <h1 id="page-title">Quais dados existem para este local?</h1>
      <p>Informe um ponto aproximado para consultar o clima e veja quais dados da área já foram registrados. A disponibilidade não significa que uma rotação já possa ser recomendada.</p>
    </section>
    <CoverageForm />
    <p className="page-link"><Link href="/culturas-possiveis">Voltar às culturas</Link> · <Link href="/">Início</Link></p>
  </main>;
}
