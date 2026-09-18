/**
 * @file page.tsx
 * @description Página de confirmação de envio documental da oficina mecânica.
 * Informa ao gestor da oficina que seus arquivos foram recebidos e estão
 * sob protocolo de análise técnica e homologação do time de auditoria.
 * @module app/loja/documento-enviado/page
 * @recommendedPath src/app/loja/documento-enviado/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";

/**
 * Metadados estáticos para a tela de confirmação de envio.
 */
export const metadata = {
  title: "Documento Enviado • IDfeed",
  description: "Confirmação de recebimento da documentação para análise.",
};

/**
 * Componente funcional da Página de Confirmação de Documento Enviado.
 *
 * @returns Interface com status de recebimento e prazos da auditoria cadastral.
 */
export default function DocumentoEnviadoPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Topbar */}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-9 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
              Documento Recebido
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Envio Concluído!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
              Recebemos seu arquivo com sucesso. Nossa equipe de auditoria técnica analisará as informações em até 24 horas.
            </p>

            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2.5 text-left mb-6">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Sua oficina permanece com status em análise até a liberação. Assim que for aprovada, todos os recursos serão ativados.
              </p>
            </div>

            <Link
              href="/loja/login"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xs"
            >
              <span>Voltar para o Login</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

