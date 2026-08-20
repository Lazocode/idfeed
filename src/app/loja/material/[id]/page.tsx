import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { formatData, TIPO_MOVIMENTACAO_LABEL } from "@/lib/utils";
import { enviarFoto, removerFoto } from "@/actions/fotos";
import type { MovimentacaoComRelacoes } from "@/lib/types";
import { getSignedPhotoUrl } from "@/lib/photos";

export const dynamic = "force-dynamic";

const MOV_BADGE: Record<string, string> = {
  entrada: "badge-green", saida: "badge-red", transferencia: "badge-blue", inventario: "badge-amber",
};

export default async function MaterialDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  const { data: material } = await supabaseAdmin
    .from("materiais")
    .select("*, movimentacoes:movimentacoes_estoque(*, responsavel:usuarios(nome))")
    .eq("id", id).eq("loja_id", lojaId)
    .order("criado_em", { referencedTable: "movimentacoes_estoque", ascending: false })
    .maybeSingle();
  if (!material) notFound();

  const { data: fotos } = await supabaseAdmin.from("fotos").select("*").eq("entidade_tipo", "material").eq("entidade_id", material.id).order("criado_em", { ascending: false });
  const fotosComUrl = await Promise.all((fotos ?? []).map(async (f) => ({ ...f, signedUrl: await getSignedPhotoUrl(f.url) })));
  const enviarFotoComId = enviarFoto.bind(null, "material", material.id);
  const baixo = material.quantidade_atual < material.quantidade_minima;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="brand">L<span>O</span>TE</div>
          <span style={{ color: "var(--border)" }}>|</span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>Estoque</span>
        </div>
        <Link href="/loja/dashboard" className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Painel</Link>
      </div>

      <div className="page-shell">
        {/* Header */}
        <div className={`card ${baixo ? "card-red" : "card-green"}`} style={{ padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Material</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{material.nome}</div>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--text-soft)" }}>
                <span>SKU: {material.sku}</span>
                {material.localizacao && <span> {material.localizacao}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div className="metric-card" style={{ minWidth: 110, borderColor: baixo ? "var(--red)" : "var(--green)" }}>
                <div className="metric-value" style={{ color: baixo ? "var(--red)" : "var(--green)" }}>{material.quantidade_atual}</div>
                <div className="metric-label">Em estoque</div>
              </div>
              <div className="metric-card" style={{ minWidth: 110 }}>
                <div className="metric-value" style={{ color: "var(--text-muted)", fontSize: "1.3rem" }}>{material.quantidade_minima}</div>
                <div className="metric-label">Mínimo</div>
              </div>
            </div>
          </div>
          {baixo && (
            <div style={{ marginTop: "0.9rem", background: "var(--red-dim)", border: "1px solid var(--red)", borderRadius: 6, padding: "0.6rem 0.9rem", fontSize: "0.82rem", color: "var(--red)" }}>
              ! Estoque abaixo do mínimo! Providencie reposição.
            </div>
          )}
        </div>

        {/* Photos */}
        <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
          <div className="section-heading">Fotos ({fotos?.length ?? 0})</div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            {fotosComUrl.map((f) => (
              <div key={f.id} style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.signedUrl} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                <form action={removerFoto.bind(null, f.id, "material", material.id)} style={{ position: "absolute", top: 3, right: 3 }}>
                  <button style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--red)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", lineHeight: 1 }}>×</button>
                </form>
              </div>
            ))}
          </div>
          <form action={enviarFotoComId} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input type="file" name="foto" accept="image/*" style={{ fontSize: "0.8rem", color: "var(--text-soft)", flex: 1 }} required />
            <button type="submit" className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem", whiteSpace: "nowrap" }}>Enviar foto</button>
          </form>
        </div>

        {/* CTA */}
        <Link href={`/loja/material/${material.id}/nova-movimentacao`} className="btn-primary" style={{ display: "flex", justifyContent: "center", width: "100%", padding: "0.75rem", marginBottom: "1.25rem" }}>
          + Registrar movimentação
        </Link>

        {/* History */}
        <div className="section-heading">Histórico de movimentações</div>
        {material.movimentacoes.length === 0 && (
          <p style={{ color: "var(--text-soft)", fontSize: "0.875rem" }}>Nenhum registro ainda.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {material.movimentacoes.map((mv: MovimentacaoComRelacoes) => (
            <div key={mv.id} className="card" style={{ padding: "0.9rem 1.1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span className={`badge ${MOV_BADGE[mv.tipo] ?? "badge-blue"}`}>{TIPO_MOVIMENTACAO_LABEL[mv.tipo]}</span>
                  {mv.quantidade !== 0 && (
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: mv.quantidade > 0 ? "var(--green)" : "var(--red)" }}>
                      {mv.quantidade > 0 ? `+${mv.quantidade}` : mv.quantidade}
                    </span>
                  )}
                </div>
                <Link href={`/loja/material/${material.id}/movimentacao/${mv.id}/editar`} style={{ fontSize: "0.75rem", color: "var(--blue)", textDecoration: "none" }}>editar</Link>
              </div>
              {mv.observacao && <p style={{ color: "var(--text-soft)", fontSize: "0.82rem", margin: "0.35rem 0 0" }}>{mv.observacao}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <span> {formatData(mv.criado_em)}</span>
                {mv.responsavel && <span> {mv.responsavel.nome}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
