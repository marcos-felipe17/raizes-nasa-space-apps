import type { Metadata } from "next";
import { Tela } from "../_ui/ui";
import RotacaoForm from "./rotacao-form";

export const metadata: Metadata = {
  title: "Raízes | Sua rotação",
  description: "Escolha as culturas da primeira e da segunda safra.",
};

export default function PlantarPage() {
  return <Tela><RotacaoForm /></Tela>;
}
