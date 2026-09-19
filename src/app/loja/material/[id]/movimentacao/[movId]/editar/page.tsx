/**
 * @file page.tsx
 * @description Página de edição de anotações da movimentação de estoque.
 * Permite complementar ou retificar descrições e números de nota fiscal
 * de movimentações já registradas sem alterar os saldos contábeis físicos.
 * @module app/loja/material/[id]/movimentacao/[movId]/editar/page
 * @recommendedPath src/app/loja/material/[id]/movimentacao/[movId]/editar/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

// 2. Ações de servidor (Server Actions)
import { editarMovimentacao } from "@/actions/movimentacoes";

// 3. Bibliotecas, serviços e utilitários internos
import { requireApprovedRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import { TIPO_MOVIMENTACAO_LABEL } from "@/lib/utils";

/**
 * Força a renderização dinâmica da página de edição.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos para a página de edição de movimentação.
 */
export const metadata = {
  title: "Editar Movimentação • IDfeed",
  description: "Atualize anotações da movimentação de estoque.",
};

/**
 * Interface tipada para as propriedades de parâmetros da URL.
 */
interface EditarMovimentacaoPageProps {
  params: Promise<{ id: string; movId: string }>;
}

/**
 * Componente assíncrono da Página de Edição de Movimentação.
 *
 * @param props - Propriedades contendo a Promise com o ID do material e o ID da movimentação.
 * @returns Interface do formulário para ajuste de anotações.
 */
export default async function EditarMovimentacaoPage({ params }: EditarMovimentacaoPageProps) {
  const { id, movId } = await params;
  const session = await requireApprovedRole(["admin", "mecanico", "atendente"]);
  const lojaId = session.user.lojaId;

  // 1. Localiza o material assegurando a posse pela loja
  const { data: material } = await supabaseAdmin
    .from("materiais")
    .select("id, nome")
    .eq("id", id)
    .eq("loja_id", lojaId)
    .maybeSingle();

  if (!material) notFound();

  // 2. Localiza a movimentação específica vinculada ao material
  const { data: mv } = await supabaseAdmin
    .from("movimentacoes_estoque")
    .select("*")
    .eq("id", movId)
    .eq("material_id", id)
    .maybeSingle();

  if (!mv) notFound();

  // Vincula os parâmetros de identificadores à ação de edição
  const acao = editarMovimentacao.bind(null, mv.id, id);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <Link href="/loja/dashboard" className="flex items-center gap-3">
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
            href={`/loja/material/${id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Material</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 text-left">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {TIPO_MOVIMENTACAO_LABEL[mv.tipo]}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {material.nome}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Editar Anotação de Movimentação
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atualize observações e referências do lançamento.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
          <form action={acao} className="space-y-5">
            <div>
              <label
                htmlFor="edit-mov-observacao"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Observações / Descrição do Lançamento
              </label>
              <textarea
                id="edit-mov-observacao"
                name="observacao"
                rows={3}
                defaultValue={mv.observacao ?? ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all resize-y"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Data e quantidade física não são editáveis para evitar descompasso com o saldo em estoque já computado. Se houver divergência, lance uma nova movimentação corretiva.
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                id="btn-editar-mov-submit"
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs cursor-pointer"
              >
                <span>Salvar Alterações</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
              <Link
                href={`/loja/material/${id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

