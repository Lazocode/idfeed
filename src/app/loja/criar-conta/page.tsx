/**
 * @file page.tsx
 * @description Página de autocadastro e credenciamento de oficinas mecânicas.
 * Coleta os dados do responsável legal, informações societárias da oficina (CNPJ, nome fantasia)
 * e credenciais de segurança para ingresso no ecossistema IDfleet.
 * @module app/loja/criar-conta/page
 * @recommendedPath src/app/loja/criar-conta/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

// 2. Componentes internos
import CriarContaForm from "@/components/criar-conta-form";

/**
 * Metadados estáticos da página para cabeçalho HTTP e SEO.
 */
export const metadata = {
  title: "Cadastrar Oficina • IDfleet",
  description: "Credencie sua oficina mecânica e comece a emitir prontuários veiculares auditados.",
};

/**
 * Componente funcional da Página de Criação de Conta da Oficina.
 *
 * @returns Interface do formulário de adesão com seções de responsável, oficina e credenciais.
 */
export default function CriarContaPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/IDfeed-logo.jpg"
              alt="IDfleet - Identidade Digital Veicular"
              width={180}
              height={48}
              priority
              referrerPolicy="no-referrer"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/loja/login"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Já tenho conta</span>
          </Link>
        </div>
      </header>

      {/* Formulário Central */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-16">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                Credenciamento de Oficina
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                Cadastre sua oficina para emitir o passaporte digital e garantir a procedência das revisões.
              </p>
            </div>

            <CriarContaForm />
          </div>
        </div>
      </main>
    </div>
  );
}
