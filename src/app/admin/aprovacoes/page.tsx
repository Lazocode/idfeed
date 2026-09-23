/**
 * @file page.tsx
 * @description Painel administrativo de homologação e credenciamento de oficinas mecânicas.
 * Consulta o banco de dados Supabase para listar oficinas pendentes, aprovadas e rejeitadas,
 * organizadas em abas com auditoria de dados e verificação de privilégios via `requireAdmin`.
 * @module app/admin/aprovacoes/page
 * @recommendedPath src/app/admin/aprovacoes/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// 2. Componentes internos
import AprovacoesTabs from "@/components/aprovacoesTabs";
import LogoutButton from "@/components/logout-button";

// 3. Bibliotecas e serviços internos
import { requireAdmin } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Força a renderização dinâmica para exibir em tempo real o status cadastral das oficinas.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos da página para cabeçalho HTTP e SEO.
 */
export const metadata = {
  title: "Gestão de Credenciamentos • IDfleet Admin",
  description: "Homologação e análise de documentos das oficinas cadastradas.",
};

/**
 * Componente assíncrono da Página de Gestão de Credenciamentos.
 *
 * @returns Interface com abas de oficinas pendentes, aprovadas e rejeitadas para auditoria técnica.
 */
export default async function AprovacoesPage() {
  // Exige que o usuário autenticado seja o administrador geral do sistema
  const session = await requireAdmin();

  // Consulta todas as oficinas cadastradas ordenadas pela data de criação
  const { data: oficinas, error } = await supabaseAdmin
    .from("lojas")
    .select("id, nome, cnpj, telefone, status, criado_em")
    .in("status", ["pendente", "aprovada", "rejeitada"])
    .order("criado_em", { ascending: true });

  // Tratamento visual para falha de comunicação com o Supabase
  if (error) {
    console.error("ERRO AO BUSCAR OFICINAS:", error);

    return (
      <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/IDfeed-logo.jpg"
                alt="IDfleet - Identidade Digital Veicular"
                width={180}
                height={48}
                priority
                referrerPolicy="no-referrer"
                className="h-8 w-auto object-contain"
              />
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 max-w-md text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Erro ao carregar aprovações</h1>
            <p className="text-sm text-slate-500 mb-6">Não foi possível carregar a listagem de oficinas do banco de dados.</p>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800"
            >
              Recarregar
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Segmentação das oficinas por estado de credenciamento
  const pendentes =
    oficinas?.filter((oficina) => oficina.status === "pendente") ?? [];

  const aprovadas =
    oficinas?.filter((oficina) => oficina.status === "aprovada") ?? [];

  const rejeitadas =
    oficinas?.filter((oficina) => oficina.status === "rejeitada") ?? [];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Topbar Institucional */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/IDfeed-logo.jpg"
                alt="IDfleet - Identidade Digital Veicular"
                width={180}
                height={48}
                priority
                referrerPolicy="no-referrer"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-xs text-slate-500 font-mono">
              {session.user.email}
            </span>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Consulta</span>
            </Link>
            <LogoutButton redirectTo="/admin/login" className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer" />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 text-left space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Homologação de Oficinas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Auditoria técnica de novos cadastros e documentos societários para credenciamento na rede IDfleet.
          </p>
        </div>

        <AprovacoesTabs
          pendentes={pendentes}
          aprovadas={aprovadas}
          rejeitadas={rejeitadas}
        />
      </main>
    </div>
  );
}

