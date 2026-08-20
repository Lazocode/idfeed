import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { editarMovimentacao } from "@/actions/movimentacoes";
import { TIPO_MOVIMENTACAO_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditarMovimentacaoPage({ params }: { params: Promise<{ id: string; movId: string }> }) {
  const { id, movId } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  const { data: material } = await supabaseAdmin.from("materiais").select("id, nome").eq("id", id).eq("loja_id", lojaId).maybeSingle();
  if (!material) notFound();

  const { data: mv } = await supabaseAdmin.from("movimentacoes_estoque").select("*").eq("id", movId).eq("material_id", id).maybeSingle();
  if (!mv) notFound();

  const acao = editarMovimentacao.bind(null, mv.id, id);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div className="brand">L<span>O</span>TE</div>
        <Link href={`/loja/material/${id}`} className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Cancelar</Link>
      </div>
      <div className="page-shell">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div className="icon-wrap icon-amber" style={{ width: 40, height: 40, borderRadius: 10 }}></div>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Editar registro</h1>
            <p style={{ color: "var(--text-soft)", fontSize: "0.8rem", margin: 0 }}>{TIPO_MOVIMENTACAO_LABEL[mv.tipo]} · {material.nome}</p>
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <form action={acao} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="label">Observações</label>
              <textarea className="input" name="observacao" rows={3} defaultValue={mv.observacao ?? ""} style={{ resize: "vertical" }} />
            </div>
            <div style={{ background: "var(--amber-dim)", border: "1px solid var(--amber)", borderRadius: 6, padding: "0.65rem 0.9rem", fontSize: "0.78rem", color: "var(--amber)" }}>
              ! Data e quantidade não são editáveis — evita descompasso com o saldo atual. Para corrigir a quantidade, registre uma nova movimentação.
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem" }}>Salvar edição</button>
              <Link href={`/loja/material/${id}`} className="btn-ghost" style={{ padding: "0.75rem 1.2rem" }}>Cancelar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
