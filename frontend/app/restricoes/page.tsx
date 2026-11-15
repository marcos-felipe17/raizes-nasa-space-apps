import type { Metadata } from "next";
import Link from "next/link";
import RestrictionCheck from "./restriction-check";

export const metadata: Metadata = {
  title: "Raízes | Verificar restrições",
  description: "Confira regras verificadas para uma proposta de duas safras.",
};

export default function RestrictionsPage() {
  return <main className="page-shell">
    <header className="page-header"><span className="brand">RAÍZES</span><span className="step">Estratégia · Restrições</span></header>
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">VERIFICAR PROPOSTA</p>
      <h1 id="page-title">A proposta viola alguma restrição conhecida?</h1>
      <p>Confira a regra aplicada, sua fonte e o motivo do resultado. Por enquanto, esta verificação cobre apenas a diversidade entre as duas culturas; ela não conclui se o plantio é adequado ao solo ou ao clima local.</p>
    </section>
    <RestrictionCheck />
    <p className="page-link"><Link href="/rotacao">Editar proposta de rotação</Link></p>
  </main>;
}
