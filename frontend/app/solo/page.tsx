import SoilForm from "./soil-form";
import Link from "next/link";

export default function SoilPage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <span className="brand">RAÍZES</span>
        <span className="step">Perfil da área · Solo</span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">CONHECER A ÁREA</p>
        <h1 id="page-title">Como é o solo da sua área de cultivo?</h1>
        <p>
          Conte o que você sabe. Se não tiver essa informação, escolha “Não sei”.
          O Raízes vai indicar essa lacuna nas análises que dependerem do solo.
        </p>
      </section>
      <SoilForm />
      <p className="page-link"><Link href="/regime-hidrico">Informar regime hídrico →</Link></p>
    </main>
  );
}
