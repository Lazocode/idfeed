/**
 * @file page.tsx
 * @description Página de autenticação administrativa do IDfeed.
 * Apresenta a interface de login restrita para administradores gerais do sistema,
 * com redirecionamento automático se já autenticado com privilégios de auditoria.
 * @module app/admin/login/page
 * @recommendedPath src/app/admin/login/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// 2. Componentes internos
import AdminLoginForm from "./admin-login-form";

// 3. Bibliotecas e serviços internos
import { auth } from "@/lib/auth";
import { isLazaroMirandaAdmin } from "@/lib/security";

/**
 * Força a renderização dinâmica da página de login administrativo.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos da página para cabeçalho HTTP e SEO.
 */
export const metadata = {
  title: "Login Administrativo • IDfeed",
  description: "Acesso restrito para administradores do sistema de aprovações.",
};

/**
 * Componente assíncrono da Página de Login Administrativo.
 *
 * @returns Interface de autenticação do administrador com validação prévia de sessão.
 */
export default async function AdminLoginPage() {
  const session = await auth();

  // Se já estiver autenticado como o administrador geral Lázaro Miranda, redireciona diretamente para o painel de aprovações
  if (session?.user?.id && isLazaroMirandaAdmin(session.user)) {
    redirect("/admin/aprovacoes");
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/IDfeed-logo.jpg"
              alt="IDfeed - Identidade Digital Veicular"
              width={180}
              height={48}
              priority
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Consulta Pública</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 text-center">
            <div className="mb-6">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 mb-2">
                Acesso Restrito
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
                Portal Administrativo
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Área reservada para gestão cadastral e homologação de oficinas parceiras.
              </p>
            </div>

            <AdminLoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}

