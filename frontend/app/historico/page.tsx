import type { Metadata } from "next";
import Link from "next/link";
import HistoryForm from "./history-form";

export const metadata: Metadata = {
  title: "Raízes | Histórico de cultivo",
  description: "Registre as culturas recentes e seus períodos nesta área de cultivo.",
};

export default function HistoryPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="brand">RAÍZES</span>
        <span className="step">Perfil da área · Histórico</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">CONHECER A ÁREA</p>
        <h1 id="page-title">O que foi cultivado nesta área?</h1>
        <p>
          Registre as culturas recentes em ordem, da mais antiga para a mais nova.
          Informe o mês de início e de fim de cada cultivo.
        </p>
      </section>
      <HistoryForm />
      <p className="page-link"><Link href="/regime-hidrico">Voltar ao regime hídrico</Link></p>
    </main>
  );
}
