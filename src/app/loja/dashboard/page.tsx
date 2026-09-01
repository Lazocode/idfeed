import Link from "next/link";
import { requireApprovedRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import { formatKm, formatPlaca } from "@/lib/utils";
import LogoutButton from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireApprovedRole([
  "admin",
  "mecanico",
  "atendente",
]);

const lojaId = session.user.lojaId;
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const { data: loja } = await supabaseAdmin.from("lojas").select("*").eq("id", lojaId).single();

  let veiculosQuery = supabaseAdmin.from("veiculos").select("*").eq("loja_id", lojaId).order("criado_em", { ascending: false });
  if (query) veiculosQuery = veiculosQuery.or(`placa.ilike.%${query}%,modelo.ilike.%${query}%,proprietario_nome.ilike.%${query}%`);
  const { data: veiculos } = await veiculosQuery;

  let materiaisQuery = supabaseAdmin.from("materiais").select("*").eq("loja_id", lojaId).order("criado_em", { ascending: false });
  if (query) materiaisQuery = materiaisQuery.or(`nome.ilike.%${query}%,sku.ilike.%${query}%`);
  const { data: materiais } = await materiaisQuery;

  const totalVeiculos = veiculos?.length ?? 0;
  const revisaoProxima = veiculos?.filter((v) => v.km_proxima_revisao && (v.km_proxima_revisao - v.km_atual) <= 3000).length ?? 0;
  const estoqueBaixo = materiais?.filter((m) => m.quantidade_atual < m.quantidade_minima).length ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="brand">L<span>O</span>TE</div>
          <span style={{ color: "var(--border)", fontSize: "1rem" }}>|</span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-soft)", fontWeight: 500 }}>{loja?.nome}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/loja/novo" className="btn-green" style={{ fontSize: "0.8rem", padding: "0.45rem 1rem" }}>
            + Novo registro
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="page-shell-wide">
        <div className="store-page-intro">
          <div>
            <span className="store-kicker">PAINEL DE OPERAÇÃO</span>
            <h1>Gestão de frota <strong>sob controle.</strong></h1>
            <p>Acompanhe veículos, materiais e manutenção em um único painel.</p>
          </div>
          <div className="store-intro-chip">Operação ativa</div>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div className="metric-card card-blue">
            <div className="metric-value" style={{ color: "var(--blue)" }}>{totalVeiculos}</div>
            <div className="metric-label">Total de veículos</div>
          </div>
          <div className="metric-card card-amber">
            <div className="metric-value" style={{ color: "var(--amber)" }}>{revisaoProxima}</div>
            <div className="metric-label">Revisões próximas</div>
          </div>
          <div className="metric-card card-red">
            <div className="metric-value" style={{ color: "var(--red)" }}>{estoqueBaixo}</div>
            <div className="metric-label">Estoque baixo</div>
          </div>
          <div className="metric-card card-green">
            <div className="metric-value" style={{ color: "var(--green)" }}>{materiais?.length ?? 0}</div>
            <div className="metric-label">Itens em estoque</div>
          </div>
        </div>

        {/* Search bar */}
        <form method="get" style={{ marginBottom: "1.5rem", position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className="input" name="q" placeholder="Buscar por placa, modelo, proprietário ou SKU..." defaultValue={query} style={{ paddingLeft: "2.4rem" }} />
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* Vehicles */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Veículos ({veiculos?.length ?? 0})</div>
              <Link href="/loja/veiculo/novo" style={{ fontSize: "0.72rem", color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>+ novo</Link>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              {(!veiculos || veiculos.length === 0) && <p style={{ padding: "1rem", color: "var(--text-soft)", fontSize: "0.85rem" }}>Nenhum veículo encontrado.</p>}
              {veiculos?.map((v) => {
                const kmToGo = v.km_proxima_revisao ? v.km_proxima_revisao - v.km_atual : null;
                const soon = kmToGo !== null && kmToGo <= 3000;
                return (
                  <Link key={v.id} href={`/loja/veiculo/${v.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="tbl-row">
                      <div className="icon-wrap icon-blue" style={{ width: 32, height: 32, borderRadius: 8, fontSize: "0.9rem" }}></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", letterSpacing: "0.03em" }}>{formatPlaca(v.placa)}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.modelo}</div>
                      </div>
                      <div>
                        {kmToGo !== null ? (
                          <span className={`badge ${soon ? "badge-amber" : "badge-green"}`}>{soon ? `${Math.max(0, kmToGo).toLocaleString("pt-BR")} km` : "em dia"}</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Materials */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <div className="section-heading" style={{ marginBottom: 0 }}>Materiais ({materiais?.length ?? 0})</div>
              <Link href="/loja/material/novo" style={{ fontSize: "0.72rem", color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>+ novo</Link>
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              {(!materiais || materiais.length === 0) && <p style={{ padding: "1rem", color: "var(--text-soft)", fontSize: "0.85rem" }}>Nenhum material encontrado.</p>}
              {materiais?.map((m) => {
                const baixo = m.quantidade_atual < m.quantidade_minima;
                return (
                  <Link key={m.id} href={`/loja/material/${m.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="tbl-row">
                      <div className="icon-wrap" style={{ width: 32, height: 32, borderRadius: 8, fontSize: "0.9rem", background: baixo ? "var(--red-dim)" : "var(--green-dim)" }}></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nome}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-soft)" }}>{m.sku}</div>
                      </div>
                      <span className={`badge ${baixo ? "badge-red" : "badge-green"}`}>{m.quantidade_atual} un.</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
