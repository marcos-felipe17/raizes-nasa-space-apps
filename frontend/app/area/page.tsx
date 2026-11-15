import type { Metadata } from "next";
import { Tela } from "../_ui/ui";
import AreaForm from "./area-form";

export const metadata: Metadata = {
  title: "Raízes | Sua área",
  description: "Informe o município, a origem da água e o tipo de solo da área.",
};

export default function AreaPage() {
  return <Tela><AreaForm /></Tela>;
}
