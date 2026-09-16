import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { editarOrdemServico } from "@/actions/ordensServico";
import { TIPO_SERVICO_LABEL, formatPlaca } from "@/lib/utils";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar Manutenção • IDfeed",
  description: "Atualize os detalhes da ordem de serviço.",
};

export default async function EditarOrdemServicoPage({ params }: { params: Promise<{ id: string; osId: string }> }) {
  const { id, osId } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  const { data: veiculo } = await supabaseAdmin
    .from("veiculos")
    .select("id, placa")
    .eq("id", id)
    .eq("loja_id", lojaId)
    .maybeSingle();

  if (!veiculo) notFound();

  const { data: os } = await supabaseAdmin
    .from("ordens_servico")
    .select("*")
    .eq("id", osId)
    .eq("veiculo_id", id)
    .maybeSingle();

  if (!os) notFound();

  const acao = editarOrdemServico.bind(null, os.id, id);

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
            href={`/loja/veiculo/${id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Prontuário</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 text-left">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              {formatPlaca(veiculo.placa)}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {TIPO_SERVICO_LABEL[os.tipo_servico]}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Editar Ordem de Serviço
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Modifique a categoria, o custo ou as notas técnicas registradas.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
          <form action={acao} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipo de Serviço
              </label>
              <select
                name="tipoServico"
                defaultValue={os.tipo_servico}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
              >
                <option value="oleo">Troca de óleo</option>
                <option value="freios">Freios</option>
                <option value="revisao">Revisão</option>
                <option value="eletrica">Elétrica</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Custo Total (R$)
              </label>
              <input
                name="custo"
                type="number"
                step="0.01"
                defaultValue={os.custo ?? ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Observações
              </label>
              <textarea
                name="observacao"
                rows={3}
                defaultValue={os.observacao ?? ""}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all resize-y"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Data, km e peças vinculadas não são editáveis para garantir a integridade auditada do histórico e do estoque.
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs cursor-pointer"
              >
                <span>Salvar Alterações</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
              <Link
                href={`/loja/veiculo/${id}`}
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
