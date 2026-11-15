import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Raízes | Perfil da área",
  description: "Etapas para descrever uma área de cultivo e conferir os dados disponíveis.",
};

const steps = [
  { href: "/localizacao", title: "Localização", text: "Município da área e contexto climático da NASA POWER." },
  { href: "/solo", title: "Solo", text: "O que se sabe sobre o solo e de onde vem a informação." },
  { href: "/regime-hidrico", title: "Regime hídrico", text: "Sequeiro ou irrigado." },
  { href: "/historico", title: "Histórico de cultivo", text: "Culturas anteriores, em ordem." },
  { href: "/culturas-possiveis", title: "Culturas candidatas", text: "Opções que você considera plantar." },
  { href: "/cobertura", title: "Cobertura de dados", text: "O que está disponível, ausente ou não verificado." },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="brand">RAÍZES</span>
        <span className="step">Perfil da área</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">CONHECER A ÁREA</p>
        <h1 id="page-title">Descreva a área antes de comparar rotações</h1>
        <p>
          Cada etapa registra um dado da área e mostra de onde ele vem. Nesta versão o
          protótipo ainda não avalia nem recomenda rotações.
        </p>
      </section>
      <section className="summary-card" aria-label="Etapas">
        <ol className="history-summary">
          {steps.map((step) => (
            <li key={step.href}>
              <strong><Link href={step.href}>{step.title}</Link></strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
