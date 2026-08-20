import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { formatKm, formatMoeda, formatData, formatPlaca, TIPO_SERVICO_LABEL } from "@/lib/utils";
import { enviarFoto, removerFoto } from "@/actions/fotos";
import { atualizarProximaRevisao } from "@/actions/veiculos";
import type { OrdemServicoComRelacoes } from "@/lib/types";
import { getSignedPhotoUrl } from "@/lib/photos";

export const dynamic = "force-dynamic";

const TIPO_COLOR: Record<string, string> = {
  oleo: "badge-amber", freios: "badge-red", revisao: "badge-blue", eletrica: "badge-purple", outros: "badge-green",
};
const DOT_COLOR: Record<string, string> = {
  oleo: "tl-dot-amber", freios: "tl-dot-red", revisao: "tl-dot-blue", eletrica: "tl-dot-purple", outros: "tl-dot-green",
};

export default async function VeiculoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const lojaId = session!.user.lojaId;

  const { data: veiculo } = await supabaseAdmin
    .from("veiculos")
    .select(`*, ordens_servico(*, mecanico:usuarios(nome), pecas:ordem_servico_materiais(quantidade, material:materiais(nome)))`)
    .eq("id", id).eq("loja_id", lojaId)
    .order("criado_em", { referencedTable: "ordens_servico", ascending: false })
    .maybeSingle();
  if (!veiculo) notFound();

  const { data: fotos } = await supabaseAdmin.from("fotos").select("*").eq("entidade_tipo", "veiculo").eq("entidade_id", veiculo.id).order("criado_em", { ascending: false });
  const fotosComUrl = await Promise.all((fotos ?? []).map(async (f) => ({ ...f, signedUrl: await getSignedPhotoUrl(f.url) })));
  const enviarFotoComId = enviarFoto.bind(null, "veiculo", veiculo.id);
  const kmToGo = veiculo.km_proxima_revisao ? veiculo.km_proxima_revisao - veiculo.km_atual : null;
  const soon = kmToGo !== null && kmToGo <= 3000;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="brand">L<span>O</span>TE</div>
          <span style={{ color: "var(--border)" }}>|</span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-soft)" }}>Detalhe do Veículo</span>
        </div>
        <Link href="/loja/dashboard" className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Painel</Link>
      </div>

      <div className="page-shell">
        {/* Vehicle header */}
        <div className="card card-blue" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Veículo</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "0.04em" }}>{formatPlaca(veiculo.placa)}</div>
              <div style={{ color: "var(--text-soft)", marginTop: "0.2rem" }}>{veiculo.modelo}</div>
              <div style={{ marginTop: "0.6rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>Código de consulta pública: <code style={{ color: "var(--blue)" }}>{veiculo.public_token}</code></div>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.6rem", fontSize: "0.82rem", color: "var(--text-soft)" }}>
                <span> {veiculo.proprietario_nome}</span>
                {veiculo.proprietario_contato && <span> {veiculo.proprietario_contato}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <div className="metric-card" style={{ minWidth: 110 }}>
                <div className="metric-value" style={{ color: "var(--blue)", fontSize: "1.3rem" }}>{formatKm(veiculo.km_atual)}</div>
                <div className="metric-label">Km atual</div>
              </div>
              <div className="metric-card" style={{ minWidth: 110 }}>
                <div className="metric-value" style={{ color: veiculo.ordens_servico.length > 0 ? "var(--green)" : "var(--text-muted)", fontSize: "1.3rem" }}>{veiculo.ordens_servico.length}</div>
                <div className="metric-label">Manutenções</div>
              </div>
            </div>
          </div>

          {/* Next service */}
          {veiculo.km_proxima_revisao && (
            <div style={{ marginTop: "1rem", background: soon ? "var(--amber-dim)" : "var(--bg)", border: `1px solid ${soon ? "var(--amber)" : "var(--border)"}`, borderRadius: 6, padding: "0.65rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", color: soon ? "var(--amber)" : "var(--text-soft)" }}>
                ! {veiculo.nota_proxima_revisao ?? "Próxima revisão"}: {formatKm(veiculo.km_proxima_revisao)}
                {kmToGo !== null && ` (faltam ${Math.max(0, kmToGo).toLocaleString("pt-BR")} km)`}
              </span>
              <details style={{ fontSize: "0.78rem" }}>
                <summary style={{ cursor: "pointer", color: "var(--blue)" }}>Editar</summary>
                <form action={atualizarProximaRevisao.bind(null, veiculo.id)} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input className="input" name="kmProximaRevisao" type="number" defaultValue={veiculo.km_proxima_revisao ?? undefined} placeholder="Km" />
                  <input className="input" name="notaProximaRevisao" defaultValue={veiculo.nota_proxima_revisao ?? ""} placeholder="Nota" />
                  <button className="btn-primary" type="submit" style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem" }}>Salvar</button>
                </form>
              </details>
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
                <form action={removerFoto.bind(null, f.id, "veiculo", veiculo.id)} style={{ position: "absolute", top: 3, right: 3 }}>
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

        {/* New maintenance CTA */}
        <Link href={`/loja/veiculo/${veiculo.id}/nova-manutencao`} className="btn-green" style={{ display: "flex", justifyContent: "center", width: "100%", padding: "0.75rem", marginBottom: "1.25rem" }}>
          + Registrar nova manutenção
        </Link>

        {/* History */}
        <div className="section-heading">Histórico de manutenção</div>
        {veiculo.ordens_servico.length === 0 && (
          <p style={{ color: "var(--text-soft)", fontSize: "0.875rem" }}>Nenhum registro ainda. Clique em &quot;Registrar nova manutenção&quot; para começar.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {veiculo.ordens_servico.map((os: OrdemServicoComRelacoes) => (
            <div key={os.id} className="card" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <span className={`badge ${TIPO_COLOR[os.tipo_servico] ?? "badge-blue"}`}>{TIPO_SERVICO_LABEL[os.tipo_servico]}</span>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", color: "var(--green)", fontWeight: 700, fontSize: "0.9rem" }}>{formatMoeda(os.custo)}</span>
                  <Link href={`/loja/veiculo/${veiculo.id}/ordem/${os.id}/editar`} style={{ fontSize: "0.75rem", color: "var(--blue)", textDecoration: "none" }}>editar</Link>
                </div>
              </div>
              {os.observacao && <p style={{ color: "var(--text-soft)", fontSize: "0.82rem", margin: "0.4rem 0 0" }}>{os.observacao}</p>}
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span> {formatData(os.criado_em)}</span>
                <span> {formatKm(os.km_no_servico)}</span>
                {os.mecanico && <span> {os.mecanico.nome}</span>}
              </div>
              {os.pecas?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.6rem" }}>
                  {os.pecas.map((p, i: number) => (
                    <span key={i} style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", borderRadius: 20, padding: "0.15rem 0.6rem", fontSize: "0.72rem", color: "var(--text-soft)" }}>
                      {p.material?.nome}{p.quantidade > 1 ? ` ×${p.quantidade}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
