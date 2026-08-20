import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { criarOrdemServico } from "@/actions/ordensServico";
import { formatPlaca } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NovaManutencaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  const { data: veiculo } = await supabaseAdmin.from("veiculos").select("*").eq("id", id).eq("loja_id", lojaId).maybeSingle();
  if (!veiculo) notFound();

  const { data: materiais } = await supabaseAdmin.from("materiais").select("*").eq("loja_id", lojaId).order("nome", { ascending: true });
  const acao = criarOrdemServico.bind(null, veiculo.id);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div className="brand">L<span>O</span>TE</div>
        <Link href={`/loja/veiculo/${veiculo.id}`} className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Voltar</Link>
      </div>
      <div className="page-shell">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div className="icon-wrap icon-green" style={{ width: 40, height: 40, borderRadius: 10 }}></div>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Nova manutenção</h1>
            <p style={{ color: "var(--text-soft)", fontSize: "0.8rem", margin: 0 }}>{formatPlaca(veiculo.placa)} · {veiculo.modelo}</p>
          </div>
        </div>

        <form action={acao} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Service info */}
          <div className="card" style={{ padding: "1.25rem" }}>
            <div className="section-heading" style={{ marginBottom: "1rem" }}>Dados do serviço</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label">Tipo de serviço *</label>
                <select className="input" name="tipoServico" required defaultValue="">
                  <option value="" disabled>Selecione o tipo</option>
                  <option value="oleo">Troca de óleo</option>
                  <option value="freios">Freios</option>
                  <option value="revisao">Revisão</option>
                  <option value="eletrica">Elétrica</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="label">Km atual *</label>
                <input className="input" name="kmNoServico" type="number" min={0} defaultValue={veiculo.km_atual} required />
              </div>
              <div>
                <label className="label">Custo (R$)</label>
                <input className="input" name="custo" type="number" step="0.01" min={0} placeholder="0,00" />
              </div>
              <div>
                <label className="label">Observações</label>
                <input className="input" name="observacao" placeholder="Detalhes do serviço..." />
              </div>
            </div>
          </div>

          {/* Parts */}
          {materiais && materiais.length > 0 && (
            <div className="card" style={{ padding: "1.25rem" }}>
              <div className="section-heading" style={{ marginBottom: "1rem" }}>Peças utilizadas <span style={{ color: "var(--text-muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {materiais.map((m) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0", borderTop: "1px solid var(--border-soft)" }}>
                    <input type="checkbox" name={`peca_${m.id}`} disabled={m.quantidade_atual === 0}
                      style={{ width: 16, height: 16, accentColor: "var(--blue)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{m.nome}</div>
                      <div style={{ fontSize: "0.72rem", color: m.quantidade_atual === 0 ? "var(--red)" : "var(--text-muted)" }}>
                        {m.quantidade_atual === 0 ? "Sem estoque" : `${m.quantidade_atual} un. disponíveis`}
                      </div>
                    </div>
                    <input type="number" name={`qtd_${m.id}`} min={1} max={m.quantidade_atual} defaultValue={1}
                      disabled={m.quantidade_atual === 0}
                      style={{ width: 64, textAlign: "center" }}
                      className="input" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn-green" style={{ flex: 1, justifyContent: "center", padding: "0.75rem" }}>
               Registrar manutenção
            </button>
            <Link href={`/loja/veiculo/${veiculo.id}`} className="btn-ghost" style={{ padding: "0.75rem 1.2rem" }}>Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
