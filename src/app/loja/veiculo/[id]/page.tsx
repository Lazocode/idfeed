/**
 * @file page.tsx
 * @description Página de prontuário e detalhes operacionais do veículo.
 * Exibe o passaporte digital, quilometragem atual, histórico de ordens de serviço (manutenções),
 * agendamento de próxima revisão programada e galeria de fotos de laudo/documentos do veículo.
 * @module app/loja/veiculo/[id]/page
 * @recommendedPath src/app/loja/veiculo/[id]/page.tsx
 */

// 1. Dependências e bibliotecas externas
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Wrench,
  Camera,
  Trash2,
  ExternalLink,
  Edit3,
} from "lucide-react";

// 2. Componentes internos
import FotoUploadForm from "@/components/foto-upload-form";

// 3. Ações de servidor (Server Actions)
import { removerFoto } from "@/actions/fotos";
import { atualizarProximaRevisao } from "@/actions/veiculos";

// 4. Bibliotecas, serviços e utilitários internos
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { getSignedPhotoUrl } from "@/lib/photos";
import {
  formatKm,
  formatMoeda,
  formatData,
  formatPlaca,
  TIPO_SERVICO_LABEL,
} from "@/lib/utils";

// 5. Tipos e interfaces
import type { OrdemServicoComRelacoes } from "@/lib/types";

/**
 * Força a renderização dinâmica no servidor para garantir dados em tempo real.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos para o prontuário veicular.
 */
export const metadata = {
  title: "Prontuário do Veículo • IDfeed",
  description: "Histórico completo, revisões programadas e fotos do veículo.",
};

/**
 * Mapa de estilos visuais (Tailwind CSS) por tipo de serviço realizado.
 */
const TIPO_BADGE_STYLE: Record<string, string> = {
  oleo: "bg-amber-50 text-amber-800 border-amber-200",
  freios: "bg-red-50 text-red-800 border-red-200",
  revisao: "bg-blue-50 text-blue-800 border-blue-200",
  eletrica: "bg-purple-50 text-purple-800 border-purple-200",
  outros: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

/**
 * Interface tipada para as propriedades de rota recebidas pela página.
 */
interface VeiculoDetalhePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Componente assíncrono da Página de Prontuário do Veículo.
 *
 * @param props - Propriedades de rota contendo a Promise com o ID do veículo (`params.id`).
 * @returns Interface completa do prontuário veicular, manutenções e galeria de fotos.
 */
export default async function VeiculoDetalhePage({ params }: VeiculoDetalhePageProps) {
  const { id } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  // 1. Busca os dados completos do veículo com ordens de serviço e insumos aplicados
  const { data: veiculo } = await supabaseAdmin
    .from("veiculos")
    .select(`*, ordens_servico(*, mecanico:usuarios(nome), pecas:ordem_servico_materiais(quantidade, material:materiais(nome)))`)
    .eq("id", id)
    .eq("loja_id", lojaId)
    .order("criado_em", { referencedTable: "ordens_servico", ascending: false })
    .maybeSingle();

  if (!veiculo) notFound();

  // 2. Busca o acervo de fotos e documentos associados ao veículo
  const { data: fotos } = await supabaseAdmin
    .from("fotos")
    .select("*")
    .eq("entidade_tipo", "veiculo")
    .eq("entidade_id", veiculo.id)
    .order("criado_em", { ascending: false });

  // 3. Gera URLs pré-assinadas temporárias e seguras para exibição das fotos no navegador
  const fotosComUrl = await Promise.all(
    (fotos ?? []).map(async (f) => ({ ...f, signedUrl: await getSignedPhotoUrl(f.url) }))
  );

  // 4. Calcula a distância restante para a próxima revisão preventiva programada
  const kmToGo = veiculo.km_proxima_revisao ? veiculo.km_proxima_revisao - veiculo.km_atual : null;
  const soon = kmToGo !== null && kmToGo <= 3000;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Topbar Institucional */}
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/loja/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Painel</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 text-left">
        
        {/* Cabeçalho do Veículo */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-base sm:text-lg font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  {formatPlaca(veiculo.placa)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Passaporte Ativo
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {veiculo.modelo}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                <span>Proprietário: <strong className="text-slate-700 font-semibold">{veiculo.proprietario_nome || "Não informado"}</strong></span>
                {veiculo.proprietario_contato && (
                  <span>Contato: <strong className="text-slate-700 font-semibold">{veiculo.proprietario_contato}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>Consulta pública:</span>
                <code className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  {veiculo.public_token}
                </code>
                <Link
                  href={`/?placa=${veiculo.placa}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium ml-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver página pública</span>
                </Link>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left min-w-[120px]">
                <span className="block text-[11px] font-medium text-slate-500">Km Atual</span>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {formatKm(veiculo.km_atual)}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left min-w-[120px]">
                <span className="block text-[11px] font-medium text-slate-500">Serviços</span>
                <span className="text-xl font-bold text-slate-900 tracking-tight">
                  {veiculo.ordens_servico.length}
                </span>
              </div>
            </div>
          </div>

          {/* Alerta de Próxima Revisão */}
          {veiculo.km_proxima_revisao && (
            <div className={`mt-6 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              soon ? "bg-amber-50/70 border-amber-200 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <div>
                <span className="font-bold">
                  {veiculo.nota_proxima_revisao ?? "Próxima revisão programada"}:
                </span>{" "}
                {formatKm(veiculo.km_proxima_revisao)}
                {kmToGo !== null && (
                  <span className="ml-1 text-[11px] font-semibold">
                    (faltam {Math.max(0, kmToGo).toLocaleString("pt-BR")} km)
                  </span>
                )}
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer font-semibold text-blue-600 hover:underline">
                  Alterar agendamento
                </summary>
                <form
                  action={atualizarProximaRevisao.bind(null, veiculo.id)}
                  className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60"
                >
                  <input
                    name="kmProximaRevisao"
                    type="number"
                    defaultValue={veiculo.km_proxima_revisao ?? undefined}
                    placeholder="Km previsto"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 w-28"
                  />
                  <input
                    name="notaProximaRevisao"
                    defaultValue={veiculo.nota_proxima_revisao ?? ""}
                    placeholder="Observação"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 w-44"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Salvar
                  </button>
                </form>
              </details>
            </div>
          )}
        </div>

        {/* Galeria de Fotos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Fotos do Veículo & Documentos ({fotos?.length ?? 0})
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            {fotosComUrl.map((f) => (
              <div key={f.id} className="relative group rounded-xl overflow-hidden border border-slate-200 w-24 h-24 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.signedUrl} alt="" className="w-full h-full object-cover" />
                <form
                  action={removerFoto.bind(null, f.id, "veiculo", veiculo.id)}
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

          <FotoUploadForm entidadeTipo="veiculo" entidadeId={veiculo.id} />
        </div>

        {/* Botão de Registro de Manutenção */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Histórico de Manutenções e Ordens de Serviço
          </h2>
          <Link
            id="btn-nova-manutencao"
            href={`/loja/veiculo/${veiculo.id}/nova-manutencao`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nova Manutenção</span>
          </Link>
        </div>

        {/* Lista do Histórico */}
        {veiculo.ordens_servico.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-10 text-center">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Nenhuma manutenção registrada ainda
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Clique no botão acima para adicionar a primeira ordem de serviço com controle de peças e odômetro.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {veiculo.ordens_servico.map((os: OrdemServicoComRelacoes) => (
              <div
                key={os.id}
                id={`ordem-servico-${os.id}`}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 transition-all hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        TIPO_BADGE_STYLE[os.tipo_servico] ?? "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {TIPO_SERVICO_LABEL[os.tipo_servico]}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatData(os.criado_em)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {formatMoeda(os.custo)}
                    </span>
                    <Link
                      id={`btn-editar-os-${os.id}`}
                      href={`/loja/veiculo/${veiculo.id}/ordem/${os.id}/editar`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </Link>
                  </div>
                </div>

                {os.observacao && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-3">
                    {os.observacao}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-3 pt-2">
                  <span>Odômetro: <strong className="text-slate-700 font-semibold">{formatKm(os.km_no_servico)}</strong></span>
                  {os.mecanico && (
                    <span>Técnico responsável: <strong className="text-slate-700 font-semibold">{os.mecanico.nome}</strong></span>
                  )}
                </div>

                {os.pecas?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 self-center mr-1">Peças aplicadas:</span>
                    {os.pecas.map((p, i: number) => (
                      <span
                        key={i}
                        className="bg-slate-50 border border-slate-200/80 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        {p.material?.nome}{p.quantidade > 1 ? ` × ${p.quantidade}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

