import type { Metadata } from "next";
import { Tela } from "../_ui/ui";
import ReportsExplorer from "./reports-explorer";

export const metadata: Metadata = {
  title: "Raízes | Relatos semelhantes",
  description: "UC-18: consultar experiências semelhantes, com semelhanças, diferenças e exclusões.",
};

export default function RelatosPage() {
  return (
    <Tela>
      <ReportsExplorer />
    </Tela>
  );
}
