import type { Metadata } from "next";
import { Suspense } from "react";
import { Tela } from "../../_ui/ui";
import ResultadoDetalhe from "./resultado-detalhe";

export const metadata: Metadata = {
  title: "Raízes | Resultado da rotação",
  description: "Estado da rotação, o motivo e o que falta para concluir.",
};

export default function DetalhePage() {
  return <Tela quente><Suspense fallback={null}><ResultadoDetalhe /></Suspense></Tela>;
}
