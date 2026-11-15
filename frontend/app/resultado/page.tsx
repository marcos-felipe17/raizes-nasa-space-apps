import type { Metadata } from "next";
import { Tela } from "../_ui/ui";
import ResultadoLista from "./resultado-lista";

export const metadata: Metadata = {
  title: "Raízes | Rotações avaliadas",
  description: "Estado de cada rotação avaliada para a área.",
};

export default function ResultadoPage() {
  return <Tela><ResultadoLista /></Tela>;
}
