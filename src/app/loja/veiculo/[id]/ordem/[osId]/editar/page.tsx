import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { editarOrdemServico } from "@/actions/ordensServico";
import { TIPO_SERVICO_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditarOrdemServicoPage({ params }: { params: Promise<{ id: string; osId: string }> }) {
  const { id, osId } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  const { data: veiculo } = await supabaseAdmin.from("veiculos").select("id, placa").eq("id", id).eq("loja_id", lojaId).maybeSingle();
  if (!veiculo) notFound();

  const { data: os } = await supabaseAdmin.from("ordens_servico").select("*").eq("id", osId).eq("veiculo_id", id).maybeSingle();
  if (!os) notFound();

  const acao = editarOrdemServico.bind(null, os.id, id);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div className="brand">L<span>O</span>TE</div>
        <Link href={`/loja/veiculo/${id}`} className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Cancelar</Link>
      </div>
      <div className="page-shell">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div className="icon-wrap icon-amber" style={{ width: 40, height: 40, borderRadius: 10 }}></div>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Editar registro</h1>
            <p style={{ color: "var(--text-soft)", fontSize: "0.8rem", margin: 0 }}>{TIPO_SERVICO_LABEL[os.tipo_servico]}</p>
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <form action={acao} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Tipo de serviço</label>
              <select className="input" name="tipoServico" defaultValue={os.tipo_servico}>
                <option value="oleo">Troca de óleo</option>
                <option value="freios">Freios</option>
                <option value="revisao">Revisão</option>
                <option value="eletrica">Elétrica</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="label">Custo (R$)</label>
              <input className="input" name="custo" type="number" step="0.01" defaultValue={os.custo ?? ""} />
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea className="input" name="observacao" rows={3} defaultValue={os.observacao ?? ""} style={{ resize: "vertical" }} />
            </div>

            <div style={{ background: "var(--amber-dim)", border: "1px solid var(--amber)", borderRadius: 6, padding: "0.65rem 0.9rem", fontSize: "0.78rem", color: "var(--amber)" }}>
              ! Data, km e peças vinculadas não são editáveis — evita descompasso com o estoque já baixado. Para corrigir, registre um novo lançamento.
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem" }}>Salvar edição</button>
              <Link href={`/loja/veiculo/${id}`} className="btn-ghost" style={{ padding: "0.75rem 1.2rem" }}>Cancelar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
