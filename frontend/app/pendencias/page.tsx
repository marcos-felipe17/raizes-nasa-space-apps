import type { Metadata } from "next";
import { Tela } from "../_ui/ui";
import Pendencias from "./pendencias";

export const metadata: Metadata = {
  title: "Raízes | O que falta",
  description: "O que já foi conferido, o que ainda falta e o que você pode fazer.",
};

export default function PendenciasPage() {
  return <Tela><Pendencias /></Tela>;
}
