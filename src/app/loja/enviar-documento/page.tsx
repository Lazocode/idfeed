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
import { redirect } from "next/navigation";
import { AlertTriangle, Clock, FileCheck, RefreshCw } from "lucide-react";

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
  const lojaId = session.user.lojaId;

  // 1. Verifica o status cadastral atual da oficina
  const { data: loja } = await supabaseAdmin
    .from("lojas")
    .select("status, nome")
    .eq("id", lojaId)
    .single();

  // Se a oficina já se encontra homologada e ativa, redireciona ao painel operacional
  if (loja?.status === "aprovada") {
    redirect("/loja/dashboard");
  }

  // 2. Busca o último documento submetido pela oficina para verificação de status
  const { data: documento } = await supabaseAdmin
    .from("documentos_oficina")
    .select("status, observacao, enviado_em, nome_arquivo")
    .eq("loja_id", lojaId)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const documentoPendente = documento?.status === "pendente";
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
            {/* Header do Card de Acordo com o Estado do Documento */}
            <div className="mb-6">
              <span
                className={`inline-block text-[11px] font-bold uppercase tracking-wider mb-1 ${
                  documentoRejeitado
                    ? "text-rose-600"
                    : documentoPendente
                      ? "text-amber-600"
                      : "text-blue-600"
                }`}
              >
                {documentoRejeitado
                  ? "Documentação Recusada"
                  : documentoPendente
                    ? "Documentação em Auditoria"
                    : "Credenciamento da Oficina"}
              </span>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {documentoRejeitado
                  ? "Corrija e Envie Novamente"
                  : documentoPendente
                    ? "Documento em Verificação"
                    : "Envio de Documentação"}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-1">
                {documentoPendente
                  ? "Sua documentação foi enviada e está sob análise técnica da administração."
                  : "Para liberar a emissão do prontuário digital e ordens de serviço, envie a identificação oficial da oficina."}
              </p>
            </div>

            {/* Cenário 1: Documento já enviado e aguardando aprovação administrativa */}
            {documentoPendente ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Aguardando homologação da administração</span>
                  </div>
                  <p className="leading-relaxed text-amber-900/90 pl-6">
                    Seu arquivo foi protocolado com sucesso e está na fila de aprovação do administrador.
                    Assim que a verificação for concluída, você terá acesso total ao painel.
                  </p>
                </div>

                {/* Detalhes do arquivo protocolado */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <FileCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-slate-800 truncate">
                      {documento.nome_arquivo || "Documento comprobatório"}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      Enviado em{" "}
                      {documento.enviado_em
                        ? new Date(documento.enviado_em).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "recente"}
                    </p>
                  </div>
                </div>

                {/* Área para substituição de documento, caso tenha enviado arquivo incorreto */}
                <div className="pt-2 border-t border-slate-100">
                  <details className="group">
                    <summary className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer list-none inline-flex items-center gap-1.5 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5 group-open:rotate-180 transition-transform duration-200" />
                      <span>Enviou o documento errado? Clique aqui para reenviar</span>
                    </summary>
                    <div className="pt-4 mt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-3">
                        Selecione um novo documento para substituir o arquivo anterior em análise:
                      </p>
                      <EnviarDocumentoForm />
                    </div>
                  </details>
                </div>
              </div>
            ) : (
              /* Cenário 2: Primeiro envio ou reenvio após rejeição */
              <div className="space-y-5">
                {documentoRejeitado && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Motivo apontado pelo administrador:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-5.5">
                      {documento?.observacao ||
                        "Documento ilegível ou inválido. Por favor, reenvie um arquivo com boa resolução."}
                    </p>
                  </div>
                )}

                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 text-xs text-slate-600">
                  Envie o contrato social, cartão CNPJ ou documento de identificação com foto (RG/CNH) do responsável técnico.
                </div>

                <EnviarDocumentoForm />

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>A análise é realizada pela equipe administrativa em até 24 horas úteis.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

