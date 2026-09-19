/**
 * @file page.tsx
 * @description Página de detalhes do material/insumo da oficina.
 * Exibe a quantidade atual em estoque, alertas de reposição mínima,
 * galeria de fotos do componente e histórico completo de movimentações de estoque.
 * @module app/loja/material/[id]/page
 * @recommendedPath src/app/loja/material/[id]/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Package,
  Camera,
  Trash2,
  Edit3,
  AlertTriangle,
} from "lucide-react";

// 2. Componentes internos
import FotoUploadForm from "@/components/foto-upload-form";

// 3. Ações de servidor (Server Actions)
import { removerFoto } from "@/actions/fotos";

// 4. Bibliotecas, serviços e utilitários internos
import { requireApprovedRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import { getSignedPhotoUrl } from "@/lib/photos";
import { formatData, TIPO_MOVIMENTACAO_LABEL } from "@/lib/utils";

// 5. Tipos e interfaces
import type { MovimentacaoComRelacoes } from "@/lib/types";

/**
 * Força a renderização dinâmica da página de detalhes do material.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos para a página de detalhes de material.
 */
export const metadata = {
  title: "Detalhe do Material • IDfeed",
  description: "Controle de saldo em estoque e histórico de movimentações da peça.",
};

/**
 * Mapeamento de estilos visuais (Tailwind CSS) para os tipos de movimentação de estoque.
 */
const MOV_BADGE_STYLE: Record<string, string> = {
  entrada: "bg-emerald-50 text-emerald-800 border-emerald-200",
  saida: "bg-rose-50 text-rose-800 border-rose-200",
  transferencia: "bg-blue-50 text-blue-800 border-blue-200",
  inventario: "bg-amber-50 text-amber-800 border-amber-200",
};

/**
 * Propriedades recebidas pela página de detalhes do material.
 */
interface MaterialDetalhePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Componente assíncrono da Página de Detalhe do Material.
 *
 * @param props - Propriedades contendo a Promise com o identificador do material (`params.id`).
 * @returns Interface com detalhes de saldo, galeria de imagens e histórico de movimentações.
 */
export default async function MaterialDetalhePage({ params }: MaterialDetalhePageProps) {
  const { id } = await params;
  const session = await requireApprovedRole(["admin", "mecanico", "atendente"]);
  const lojaId = session.user.lojaId;

  // Busca o material com suas movimentações de estoque e responsáveis associados
  const { data: material } = await supabaseAdmin
    .from("materiais")
    .select("*, movimentacoes:movimentacoes_estoque(*, responsavel:usuarios(nome))")
    .eq("id", id)
    .eq("loja_id", lojaId)
    .order("criado_em", { referencedTable: "movimentacoes_estoque", ascending: false })
    .maybeSingle();

  if (!material) notFound();

  // Consulta fotos anexadas ao material
  const { data: fotos } = await supabaseAdmin
    .from("fotos")
    .select("*")
    .eq("entidade_tipo", "material")
    .eq("entidade_id", material.id)
    .order("criado_em", { ascending: false });

  // Gera URLs assinadas para exibição segura das fotos
  const fotosComUrl = await Promise.all(
    (fotos ?? []).map(async (f) => ({ ...f, signedUrl: await getSignedPhotoUrl(f.url) }))
  );

  // Determina se o material está abaixo do nível mínimo de reposição
  const baixo = material.quantidade_atual < material.quantidade_minima;

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
            href="/loja/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 text-left">
        
        {/* Header do Material */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  SKU: {material.sku}
                </span>
                {material.localizacao && (
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {material.localizacao}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {material.nome}
              </h1>
            </div>

            {/* Saldos */}
            <div className="flex items-center gap-3 shrink-0">
              <div className={`p-4 rounded-xl border text-left min-w-[120px] ${
                baixo ? "bg-rose-50/70 border-rose-200" : "bg-slate-50 border-slate-200/80"
              }`}>
                <span className="block text-[11px] font-medium text-slate-500">Saldo Atual</span>
                <span className={`text-2xl font-bold tracking-tight ${baixo ? "text-rose-600" : "text-slate-900"}`}>
                  {material.quantidade_atual}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left min-w-[120px]">
                <span className="block text-[11px] font-medium text-slate-500">Mínimo (Alerta)</span>
                <span className="text-2xl font-bold text-slate-500 tracking-tight">
                  {material.quantidade_minima}
                </span>
              </div>
            </div>
          </div>

          {baixo && (
            <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Estoque abaixo da quantidade mínima recomendada! Providencie reposição com fornecedor.</span>
            </div>
          )}
        </div>

        {/* Fotos da Peça */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Fotos da Peça / Embalagem ({fotos?.length ?? 0})
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {fotosComUrl.map((f) => (
              <div key={f.id} className="relative group rounded-xl overflow-hidden border border-slate-200 w-24 h-24 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.signedUrl} alt="" className="w-full h-full object-cover" />
                <form
                  action={removerFoto.bind(null, f.id, "material", material.id)}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <button
                    title="Excluir foto"
                    className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </form>
              </div>
            ))}
          </div>

          <FotoUploadForm entidadeTipo="material" entidadeId={material.id} />
        </div>

        {/* Movimentações de Estoque */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Histórico de Movimentações
          </h2>
          <Link
            href={`/loja/material/${material.id}/nova-movimentacao`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Movimentação</span>
          </Link>
        </div>

        {material.movimentacoes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-10 text-center">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Nenhuma movimentação registrada ainda
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Registre entradas de notas fiscais, saídas manuais ou ajustes de inventário.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {material.movimentacoes.map((mv: MovimentacaoComRelacoes) => (
              <div
                key={mv.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 transition-all hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        MOV_BADGE_STYLE[mv.tipo] ?? "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {TIPO_MOVIMENTACAO_LABEL[mv.tipo]}
                    </span>

                    {mv.quantidade !== 0 && (
                      <span className={`font-mono text-sm font-bold ${mv.quantidade > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {mv.quantidade > 0 ? `+${mv.quantidade}` : mv.quantidade} un.
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/loja/material/${material.id}/movimentacao/${mv.id}/editar`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </Link>
                </div>

                {mv.observacao && (
                  <p className="text-xs text-slate-600 mt-2">
                    {mv.observacao}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                  <span>Data: <strong className="text-slate-600">{formatData(mv.criado_em)}</strong></span>
                  {mv.responsavel && (
                    <span>Responsável: <strong className="text-slate-600">{mv.responsavel.nome}</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

