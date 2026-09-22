import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agência Simples",
  description: "CRM, tarefas e calendário de conteúdo para agências de marketing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
