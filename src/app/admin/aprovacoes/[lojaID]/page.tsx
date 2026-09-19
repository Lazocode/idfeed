/**
 * @file page.tsx
 * @description Página de detalhe e auditoria cadastral de uma oficina mecânica específica.
 * Permite ao administrador inspecionar o contrato social ou documento comprobatório
 * via URL assinada segura e realizar a aprovação ou recusa com registro de justificativa.
 * @module app/admin/aprovacoes/[lojaID]/page
 * @recommendedPath src/app/admin/aprovacoes/[lojaID]/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink, FileText, Building2, Phone, Hash } from "lucide-react";

// 2. Componentes internos
import AprovacaoOficina from "@/components/aprovacaoOficina";
import LogoutButton from "@/components/logout-button";

// 3. Bibliotecas e serviços internos
import { requireAdmin } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Força a renderização dinâmica da página de auditoria documental.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos para a página de análise cadastral.
 */
export const metadata = {
  title: "Análise Cadastral de Oficina • IDfeed Admin",
  description: "Auditoria documental da oficina credenciada.",
};

/**
 * Interface tipada para os parâmetros da rota dinâmica de aprovação de oficina.
 */
interface AnaliseOficinaPageProps {
  params: Promise<{
    lojaID?: string;
    lojaId?: string;
  }>;
}

/**
 * Componente assíncrono da Página de Análise Cadastral da Oficina.
 *
 * @param props - Propriedades contendo a Promise com o ID da oficina a ser auditada.
 * @returns Interface de análise detalhada dos dados e documentos com ações de aprovação.
 */
export default async function AnaliseOficinaPage({ params }: AnaliseOficinaPageProps) {
  // Exige permissões de administrador geral
  await requireAdmin();

  // Resolução defensiva do parâmetro para cobrir variações de case da pasta dinâmica
  const resolvedParams = await params;
  const lojaId = resolvedParams.lojaID || resolvedParams.lojaId || "";

  // Busca os dados cadastrais da oficina
  const { data: loja, error: lojaError } = await supabaseAdmin
    .from("lojas")
    .select("id, nome, cnpj, telefone, status, criado_em")
    .eq("id", lojaId)
    .single();

  if (lojaError || !loja) {
    return (
      <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
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

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 max-w-md text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Oficina não encontrada</h1>
            <p className="text-sm text-slate-500 mb-6">Não foi possível localizar os registros desta oficina.</p>
            <Link
              href="/admin/aprovacoes"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800"
            >
              Voltar para a lista
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Busca o documento mais recente anexado pela oficina para credenciamento
  const { data: documentos, error: documentoError } = await supabaseAdmin
    .from("documentos_oficina")
    .select("id, nome_arquivo, caminho_arquivo, status, enviado_em")
    .eq("loja_id", lojaId)
    .order("enviado_em", { ascending: false });

  if (documentoError) {
    console.error("ERRO AO BUSCAR DOCUMENTOS:", documentoError);
  }

  const documento = documentos?.[0];
  let documentoUrl: string | null = null;

  // Gera URL assinada temporária (10 minutos) para visualização segura sem expor o bucket publicamente
  if (documento) {
    const { data } = await supabaseAdmin.storage
      .from("documentos-oficinas")
      .createSignedUrl(documento.caminho_arquivo, 60 * 10);

    documentoUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/aprovacoes"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Aprovações</span>
            </Link>
            <LogoutButton redirectTo="/admin/login" className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer" />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 text-left">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1 block">
            Auditoria de Credenciamento
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {loja.nome}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Examine a documentação legal e aprove ou recuse o ingresso da oficina.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Dados da Oficina */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
            <div className="pb-3 mb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Cadastro da Empresa
              </span>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Razão / Nome: <strong className="text-slate-900">{loja.nome}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                <span>CNPJ: <strong className="text-slate-900 font-mono">{loja.cnpj || "Não informado"}</strong></span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Telefone: <strong className="text-slate-900">{loja.telefone || "Não informado"}</strong></span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-xs text-slate-400">Status Cadastral:</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    loja.status === "pendente"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : loja.status === "aprovada"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {loja.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Documento Enviado */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
            <div className="pb-3 mb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Documentação Comprobatória
              </span>
            </div>

            {!documento ? (
              <p className="text-xs sm:text-sm text-slate-400 py-6 text-center">
                Nenhum documento anexado até o momento.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-slate-800 truncate">
                      {documento.nome_arquivo}
                    </p>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Status do arquivo: <strong className="text-slate-600">{documento.status}</strong>
                    </span>
                  </div>
                </div>

                {documentoUrl && (
                  <div>
                    <a
                      href={documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
                    >
                      <span>Abrir Documento em Nova Aba</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <AprovacaoOficina lojaId={lojaId} status={loja.status} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

