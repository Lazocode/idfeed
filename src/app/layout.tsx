/**
 * @file layout.tsx
 * @description Layout raiz global da aplicação Next.js. Define metadados SEO,
 * fontes, estrutura HTML inicial e provedores de contexto compartilhados.
 * @module app/layout
 * @recommendedPath src/app/layout.tsx
 */

// 1. Dependências e bibliotecas externas
import type { Metadata } from "next";

// 2. Componentes internos
import Providers from "@/components/providers";
import FeedbackWidget from "@/components/feedback-widget";

// 3. Estilos globais
import "./globals.css";

/**
 * Metadados estáticos globais da plataforma para indexação e compartilhamento.
 */
export const metadata: Metadata = {
  title: "IDfeed — Identidade Digital e Prontuário Veicular",
  description:
    "Consulta de histórico de veículo por placa e CPF, e painel de gestão de frotas, materiais e ordens de serviço para oficinas.",
};

/**
 * Componente de layout raiz da aplicação (RootLayout).
 *
 * @param props - Propriedades do componente contendo nós filhos.
 * @param props.children - Conteúdo das páginas a serem renderizadas na árvore.
 * @returns Estrutura HTML/Body principal com provedores de sessão e contexto.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* Provedor unificado de contexto NextAuth e sessões globais */}
        <Providers>{children}</Providers>
        {/* Widget global de feedback para clientes e testadores em ambiente de teste/deploy */}
        <FeedbackWidget />
      </body>
    </html>
  );
}

