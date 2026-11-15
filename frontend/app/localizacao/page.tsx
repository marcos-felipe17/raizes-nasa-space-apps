import type { Metadata } from "next";
import Link from "next/link";
import LocationForm from "./location-form";

export const metadata: Metadata = {
  title: "Raízes | Localização da área",
  description: "Informe o município da área para obter coordenadas e contexto climático.",
};

export default function LocationPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="brand">RAÍZES</span>
        <span className="step">Perfil da área · Local</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">CONHECER A ÁREA</p>
        <h1 id="page-title">Onde fica a área?</h1>
        <p>
          Informe o município e a UF. O contexto climático da NASA POWER é só referência:
          ele não muda o resultado de nenhuma regra agronômica.
        </p>
      </section>
      <LocationForm />
      <p className="page-link"><Link href="/">Início</Link> · <Link href="/solo">Informar solo →</Link></p>
    </main>
  );
}
