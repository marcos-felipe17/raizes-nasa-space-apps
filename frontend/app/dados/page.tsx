import type { Metadata } from "next";
import { Tela } from "../_ui/ui";
import DadosArea from "./dados-area";

export const metadata: Metadata = {
  title: "Raízes | O que já sabemos",
  description: "Dados encontrados e lacunas da área, com a origem de cada um.",
};

export default function DadosPage() {
  return <Tela><DadosArea /></Tela>;
}
