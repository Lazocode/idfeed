import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { registrarMovimentacao } from "@/actions/movimentacoes";

export const dynamic = "force-dynamic";

export default async function NovaMovimentacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  const { data: material } = await supabaseAdmin.from("materiais").select("*").eq("id", id).eq("loja_id", lojaId).maybeSingle();
  if (!material) notFound();

  const acao = registrarMovimentacao.bind(null, material.id);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div className="brand">L<span>O</span>TE</div>
        <Link href={`/loja/material/${material.id}`} className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Voltar</Link>
      </div>
      <div className="page-shell">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div className="icon-wrap icon-blue" style={{ width: 40, height: 40, borderRadius: 10 }}></div>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Nova movimentação</h1>
            <p style={{ color: "var(--text-soft)", fontSize: "0.8rem", margin: 0 }}>{material.nome} · {material.quantidade_atual} un. em estoque</p>
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <form action={acao} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label">Tipo *</label>
                <select className="input" name="tipo" required defaultValue="">
                  <option value="" disabled>Selecione o tipo</option>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                  <option value="transferencia">Transferência</option>
                  <option value="inventario">Contagem</option>
                </select>
              </div>
              <div>
                <label className="label">Quantidade</label>
                <input className="input" name="quantidade" type="number" min={0} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea className="input" name="observacao" rows={3} placeholder="Detalhes..." style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center", padding: "0.75rem" }}>
                 Registrar movimentação
              </button>
              <Link href={`/loja/material/${material.id}`} className="btn-ghost" style={{ padding: "0.75rem 1.2rem" }}>Cancelar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
