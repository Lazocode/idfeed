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
import { requireApprovedRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import { getSignedPhotoUrl } from "@/lib/photos";
import { isValidUuid } from "@/lib/validation";
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
  const session = await requireApprovedRole(["admin", "mecanico", "atendente"]);
  const lojaId = session.user.lojaId;

  if (!isValidUuid(id)) {
    notFound();
  }

  // 1. Busca os dados completos do veículo (omitindo proprietario_cpf_hash) com ordens de serviço e insumos aplicados
  const { data: veiculo } = await supabaseAdmin
    .from("veiculos")
    .select(
      `
      id,
      loja_id,
      public_token,
      placa,
      modelo,
      proprietario_nome,
      proprietario_contato,
      km_atual,
      km_proxima_revisao,
      nota_proxima_revisao,
      criado_em,
      atualizado_em,
      ordens_servico(
        id,
        tipo_servico,
        km_no_servico,
        custo,
        observacao,
        criado_em,
        mecanico:usuarios(nome),
        pecas:ordem_servico_materiais(quantidade, material:materiais(nome))
      )
      `
    )
    .eq("id", id)
    .eq("loja_id", lojaId)
    .order("criado_em", { referencedTable: "ordens_servico", ascending: false })
    .maybeSingle();

  if (!veiculo) notFound();

  const ordensServico: OrdemServicoComRelacoes[] = (veiculo.ordens_servico || []).map(
    (os) => ({
      id: os.id,
      tipo_servico: os.tipo_servico,
      km_no_servico: os.km_no_servico,
      custo: os.custo,
      observacao: os.observacao,
      criado_em: os.criado_em,
      mecanico: Array.isArray(os.mecanico)
        ? os.mecanico[0] ?? null
        : os.mecanico ?? null,
      pecas: (os.pecas || []).map((p) => ({
        quantidade: p.quantidade,
        material: Array.isArray(p.material)
          ? p.material[0] ?? null
          : p.material ?? null,
      })),
    })
  );

  // 2. Busca o acervo de fotos e documentos associados ao veículo
  const { data: fotos } = await supabaseAdmin
    .from("fotos")
    .select("id, entidade_tipo, entidade_id, url, legenda, criado_em")
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
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/loja/dashboard" className="shrink-0">
              <Image
                src="/logo-idv.png"
                alt="IDV"
                width={38}
                height={38}
                className="object-contain sm:w-[44px] sm:h-[44px]"
              />
            </Link>
            <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />
            <Link
              href="/loja/dashboard"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors truncate"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span className="truncate">Voltar ao painel</span>
            </Link>
          </div>
          <Link
            href={`/v/${veiculo.public_token}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/70 px-2.5 sm:px-3.5 py-2 rounded-lg transition-colors shrink-0"
          >
            <span className="hidden xs:inline">Ver Passaporte Público</span>
            <span className="xs:hidden">Passaporte</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Card Principal do Veículo */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-slate-900 text-white font-mono font-bold text-lg px-3.5 py-1.5 rounded-lg tracking-wider mb-3">
                {formatPlaca(veiculo.placa)}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {veiculo.modelo}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>
                  Proprietário: <strong className="text-slate-700">{veiculo.proprietario_nome}</strong>
                </span>
                {veiculo.proprietario_contato && (
                  <span>
                    Contato: <strong className="text-slate-700">{veiculo.proprietario_contato}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 bg-slate-50 border border-slate-200/70 rounded-xl px-5 py-4 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Quilometragem Atual
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono">
                {formatKm(veiculo.km_atual)}
              </span>
            </div>
          </div>

          {/* Alerta da Próxima Revisão */}
          {veiculo.km_proxima_revisao && (
            <div
              className={`mt-6 rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                soon
                  ? "bg-amber-50/90 border-amber-200 text-amber-900"
                  : "bg-blue-50/70 border-blue-200/80 text-blue-900"
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                  {soon ? "Atenção: Revisão Próxima" : "Próxima Revisão Programada"}
                </div>
                <div className="text-sm font-semibold mt-0.5">
                  Aos {formatKm(veiculo.km_proxima_revisao)}
                  {veiculo.nota_proxima_revisao && ` — ${veiculo.nota_proxima_revisao}`}
                </div>
              </div>
              <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/80 border border-current/10 self-start sm:self-center">
                {kmToGo !== null && kmToGo > 0
                  ? `Faltam ${formatKm(kmToGo)}`
                  : "Revisão vencida / atingida"}
              </div>
            </div>
          )}
        </div>

        {/* Grid de Formulário Rápido de Próxima Revisão + Ação de Nova Manutenção */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Programar Próxima Revisão
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Atualize o lembrete que aparece no passaporte público do proprietário.
            </p>
            <form
              action={atualizarProximaRevisao.bind(null, veiculo.id)}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3"
            >
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Próxima Revisão (KM)
                </label>
                <input
                  name="kmProximaRevisao"
                  type="number"
                  min={0}
                  defaultValue={veiculo.km_proxima_revisao ?? ""}
                  placeholder="Ex: 70000"
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Recomendação / Nota
                </label>
                <input
                  name="notaProximaRevisao"
                  defaultValue={veiculo.nota_proxima_revisao ?? ""}
                  placeholder="Ex: Troca de óleo e filtros"
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Salvar Lembrete
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold">Nova Ordem de Serviço</h2>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Registre um atendimento realizado, atualize o odômetro e dê baixa automática nas peças usadas.
              </p>
            </div>
            <Link
              href={`/loja/veiculo/${veiculo.id}/nova-manutencao`}
              className="mt-5 inline-flex items-center justify-center gap-2 w-full h-10 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Registrar Manutenção
            </Link>
          </div>
        </div>

        {/* Seção: Histórico de Ordens de Serviço */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Histórico de Manutenções ({ordensServico.length})
            </h2>
            <p className="text-xs text-slate-500">
              Registro cronológico de intervenções realizadas na oficina
            </p>
          </div>
        </div>

        {/* Lista do Histórico */}
        {ordensServico.length === 0 ? (
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
            {ordensServico.map((os: OrdemServicoComRelacoes) => (
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
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {formatKm(os.km_no_servico)}
                    </span>
                    {os.custo !== null && (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md">
                        {formatMoeda(Number(os.custo))}
                      </span>
                    )}
                    <Link
                      href={`/loja/veiculo/${veiculo.id}/ordem/${os.id}/editar`}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                      title="Editar Ordem de Serviço"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </Link>
                  </div>
                </div>

                {os.observacao && (
                  <p className="text-sm text-slate-700 mt-3 leading-relaxed">
                    {os.observacao}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div>
                    Responsável:{" "}
                    <strong className="text-slate-700">
                      {os.mecanico?.nome ?? "Equipe da Oficina"}
                    </strong>
                  </div>

                  {os.pecas && os.pecas.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400">Peças aplicadas:</span>
                      {os.pecas.map((p, idx: number) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                        >
                          {p.quantidade}x {p.material?.nome ?? "Item"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Seção: Galeria de Fotos do Veículo */}
        <div className="mt-10 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Fotos e Documentos do Veículo ({fotosComUrl.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-5">
            Anexe fotos de vistoria, laudos ou comprovantes de serviço (armazenamento privado com acesso temporário assinado).
          </p>

          <FotoUploadForm entidadeTipo="veiculo" entidadeId={veiculo.id} />

          {fotosComUrl.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {fotosComUrl.map((f) => (
                <div
                  key={f.id}
                  className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col"
                >
                  {f.signedUrl ? (
                    <a
                      href={f.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-video bg-slate-100 overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.signedUrl}
                        alt={f.legenda ?? "Foto do veículo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </a>
                  ) : (
                    <div className="aspect-video bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      Imagem indisponível
                    </div>
                  )}
                  <div className="p-3 flex items-center justify-between gap-2 bg-white border-t border-slate-100">
                    <div className="truncate">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {f.legenda || "Sem legenda"}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatData(f.criado_em)}</p>
                    </div>
                    <form action={removerFoto.bind(null, f.id, "veiculo", veiculo.id)}>
                      <button
                        type="submit"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
