/**
 * @file page.tsx
 * @description Página de autenticação das oficinas credenciadas no IDfeed.
 * Apresenta a interface de login da loja e links de apoio para cadastro e acesso administrativo.
 * @module app/loja/login/page
 * @recommendedPath src/app/loja/login/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// 2. Componentes internos
import LoginForm from "./login-form";

/**
 * Metadados estáticos da página para cabeçalho HTTP e SEO.
 */
export const metadata = {
  title: "Acesso da Oficina • IDfeed",
  description: "Faça login para gerenciar prontuários, revisões e estoque da oficina credenciada.",
};

/**
 * Componente funcional da Página de Login da Oficina.
 *
 * @returns Interface de autenticação com formulário de login e links de cadastro.
 */
export default function LoginPage() {
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
            <span>Consultar Veículo</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 text-center">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
                Acesso da Oficina
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Informe suas credenciais para gerenciar prontuários e vistorias.
              </p>
            </div>

            <LoginForm />

            <div className="my-6 border-t border-slate-100" />

            <div className="space-y-2.5">
              <Link
                href="/loja/criar-conta"
                className="block text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Ainda não tem conta? Cadastrar oficina credenciada
              </Link>
              <Link
                href="/admin/login"
                className="block text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Acesso restrito para administradores do sistema
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

