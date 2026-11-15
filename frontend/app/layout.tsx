import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raízes | Explorar cenários",
  description: "Explore cenários simulados de cultivo no Raízes.",
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
