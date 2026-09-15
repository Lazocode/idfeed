import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "IDfeed — Identidade Digital e Prontuário Veicular",
  description: "Consulta de histórico de veículo por placa e CPF, e painel de gestão de frotas, materiais e ordens de serviço para oficinas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
