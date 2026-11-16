import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Raízes | Todas as etapas",
  description: "Etapas para descrever uma área de cultivo e conferir os dados disponíveis.",
};

const steps = [
  { href: "/localizacao", title: "Localização", text: "Município da área e contexto climático da NASA POWER." },
  { href: "/solo", title: "Solo", text: "O que se sabe sobre o solo e de onde vem a informação." },
  { href: "/regime-hidrico", title: "Regime hídrico", text: "Sequeiro ou irrigado." },
  { href: "/historico", title: "Histórico de cultivo", text: "Culturas anteriores, em ordem." },
  { href: "/culturas-possiveis", title: "Culturas candidatas", text: "Opções que você considera plantar." },
  { href: "/cobertura", title: "Cobertura de dados", text: "O que está disponível, ausente ou não verificado." },
  { href: "/rotacao", title: "Proposta de rotação", text: "Duas safras, cada uma com cultura e período." },
  { href: "/restricoes", title: "Restrições", text: "Regra aplicada à proposta, com motivo e fontes." },
  { href: "/alternativas", title: "Alternativas", text: "Sequências documentadas, só em regiões conferidas." },
  { href: "/comparar", title: "Comparação", text: "Proposta e alternativas lado a lado, sem ranking." },
  { href: "/relatos", title: "Relatos", text: "Experiências semelhantes, com semelhanças, diferenças e exclusões." },
];

export default function EtapasPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <Link href="/" className="brand">RAÍZES</Link>
        <span className="step">Perfil da área</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">CONHECER A ÁREA</p>
        <h1 id="page-title">Todas as etapas, em detalhe</h1>
        <p>
          Formulários completos de cada etapa, com a origem de cada dado. O fluxo resumido
          começa na <Link href="/">página inicial</Link>.
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
