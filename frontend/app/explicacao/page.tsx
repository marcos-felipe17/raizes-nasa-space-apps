import type { Metadata } from "next";
import Link from "next/link";
import ExplanationView from "./explanation-view";

export const metadata: Metadata = {
  title: "Raízes | Explicação da proposta",
  description: "Entenda critérios, restrições e incertezas da análise disponível.",
};

export default function ExplanationPage() {
  return <main className="page-shell">
    <header className="page-header"><span className="brand">RAÍZES</span><span className="step">Estratégia · Explicação</span></header>
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">ENTENDER O RESULTADO</p>
      <h1 id="page-title">Por que a proposta recebeu este estado?</h1>
      <p>Veja os critérios realmente verificados, as restrições encontradas e o que ainda impede uma conclusão sobre a área.</p>
    </section>
    <ExplanationView />
    <p className="page-link"><Link href="/restricoes">Voltar às restrições</Link></p>
  </main>;
}
