import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { criarOrdemServico } from "@/actions/ordensServico";
import { formatPlaca } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Registrar Manutenção • IDfeed",
  description: "Registre uma ordem de serviço no prontuário digital do veículo.",
};

export default async function NovaManutencaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  const { data: veiculo } = await supabaseAdmin
    .from("veiculos")
    .select("*")
    .eq("id", id)
    .eq("loja_id", lojaId)
    .maybeSingle();

  if (!veiculo) notFound();

  const { data: materiais } = await supabaseAdmin
    .from("materiais")
    .select("*")
    .eq("loja_id", lojaId)
    .order("nome", { ascending: true });

  const acao = criarOrdemServico.bind(null, veiculo.id);

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
          <Link
            href={`/loja/veiculo/${veiculo.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Prontuário</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 text-left">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              {formatPlaca(veiculo.placa)}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {veiculo.modelo}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Registrar Manutenção
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Preencha os detalhes do serviço realizado para auditoria e controle do odômetro.
          </p>
        </div>

        <form action={acao} className="space-y-6">
          {/* Card: Dados do Serviço */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8 space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Informações do Serviço
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Serviço *
                </label>
                <select
                  name="tipoServico"
                  required
                  defaultValue=""
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                >
                  <option value="" disabled>Selecione a categoria</option>
                  <option value="oleo">Troca de Óleo e Filtros</option>
                  <option value="freios">Sistema de Freios</option>
                  <option value="revisao">Revisão Periódica / Preventiva</option>
                  <option value="eletrica">Elétrica e Bateria</option>
                  <option value="outros">Outros Serviços</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Km Atual no Momento do Serviço *
                </label>
                <input
                  name="kmNoServico"
                  type="number"
                  min={0}
                  defaultValue={veiculo.km_atual}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Valor Total do Serviço (R$)
                </label>
                <input
                  name="custo"
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="0,00"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Observações / Diagnóstico
                </label>
                <input
                  name="observacao"
                  placeholder="Ex: Substituição de pastilhas dianteiras e fluido"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card: Peças Utilizadas */}
          {materiais && materiais.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Baixa de Peças do Estoque (Opcional)
                </span>
                <span className="text-xs text-slate-400">
                  Serão descontadas automaticamente
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {materiais.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name={`peca_${m.id}`}
                        disabled={m.quantidade_atual === 0}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-800 block">
                          {m.nome}
                        </span>
                        <span className={`text-xs ${m.quantidade_atual === 0 ? "text-rose-500 font-semibold" : "text-slate-400"}`}>
                          {m.quantidade_atual === 0 ? "Sem estoque" : `${m.quantidade_atual} un. disponíveis no estoque`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Qtd:</span>
                      <input
                        type="number"
                        name={`qtd_${m.id}`}
                        min={1}
                        max={m.quantidade_atual}
                        defaultValue={1}
                        disabled={m.quantidade_atual === 0}
                        className="w-16 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-sm text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs cursor-pointer"
            >
              <span>Gravar no Prontuário</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </button>
            <Link
              href={`/loja/veiculo/${veiculo.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
