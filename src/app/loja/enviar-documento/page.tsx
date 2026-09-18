/**
 * @file page.tsx
 * @description Página de envio de documentos comprobatórios da oficina mecânica.
 * Permite ao responsável legal fazer upload do contrato social ou documento com foto
 * para análise e homologação cadastral no IDfeed.
 * @module app/loja/enviar-documento/page
 * @recommendedPath src/app/loja/enviar-documento/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, Clock } from "lucide-react";

// 2. Componentes internos
import EnviarDocumentoForm from "@/components/enviar-documento-form";
import LogoutButton from "@/components/logout-button";

// 3. Bibliotecas e serviços internos
import { requireSession } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Força a renderização dinâmica da página de envio de documentos.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos para a página de envio de documentos.
 */
export const metadata = {
  title: "Envio de Documentos • IDfeed",
  description: "Envio de documentação comprobatória da oficina para análise e liberação cadastral.",
};

/**
 * Componente assíncrono da Página de Envio de Documento da Oficina.
 *
 * @returns Interface com formulário de upload de documentos e feedback de análises anteriores.
 */
export default async function EnviarDocumentoPage() {
  // Exige que o usuário possua uma sessão ativa no sistema
  const session = await requireSession();
  const isAdmin = session.user.papel === "admin";

  // Busca o último documento submetido pela oficina para verificação de status (ex: rejeitado)
  const { data: documento } = await supabaseAdmin
    .from("documentos_oficina")
    .select("status, observacao, enviado_em")
    .eq("loja_id", session.user.lojaId)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const documentoRejeitado = documento?.status === "rejeitado";

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
          <div className="flex items-center gap-3">
            <LogoutButton className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer">
              Sair da Conta
            </LogoutButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-9 text-left">
            <div className="mb-6">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                {documentoRejeitado ? "Documento Rejeitado" : "Credenciamento da Oficina"}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {documentoRejeitado ? "Corrija e envie novamente" : "Envio de Documentação"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-1">
                Para liberar a emissão do prontuário digital e ordens de serviço, envie a identificação oficial da oficina.
              </p>
            </div>

            {isAdmin ? (
              <div className="space-y-5">
                {documentoRejeitado && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Motivo apontado pela análise:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5.5">
                      {documento?.observacao || "Documento ilegível ou inválido. Por favor, reenvie um arquivo com boa resolução."}
                    </p>
                  </div>
                )}

                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 text-xs text-slate-600">
                  Envie o contrato social, cartão CNPJ ou documento de identificação com foto do responsável técnico.
                </div>

                <EnviarDocumentoForm />

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>A análise é realizada pela equipe técnica em até 24 horas úteis.</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <p className="font-semibold mb-1">Acesso Restrito ao Administrador</p>
                <p className="leading-relaxed">
                  Apenas o usuário administrador da sua oficina tem permissão para enviar ou atualizar os documentos de credenciamento.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

