import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raízes | Solo da área",
  description: "Informe as condições do solo da sua área de cultivo.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
