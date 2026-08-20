import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { formatPlaca, formatKm, formatData, TIPO_SERVICO_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function buscarVeiculo(token: string) {
  const { data: veiculo } = await supabaseAdmin
    .from("veiculos")
    .select("id, placa, modelo, km_atual, km_proxima_revisao, nota_proxima_revisao, loja:lojas(nome), ordens_servico(tipo_servico, km_no_servico, criado_em)")
    .eq("public_token", token)
    .maybeSingle();
  return veiculo;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const resultado = token && /^[a-f0-9]{48}$/i.test(token) ? await buscarVeiculo(token) : null;
  const invalido = Boolean(token && !resultado);
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div className="brand">L<span>O</span>TE</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/loja/login" className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>Entrar</Link>
          <Link href="/loja/criar-conta" className="btn-primary" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>Criar conta</Link>
        </div>
      </div>
      <div className="page-shell">
        <div style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
          <span className="eyebrow">Consulta pública</span>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0.5rem 0" }}>Histórico do veículo</h1>
          <p style={{ color: "var(--text-soft)", fontSize: "0.95rem", marginBottom: "2rem" }}>
            Use o código de consulta fornecido pela oficina para visualizar o histórico autorizado.
          </p>
          <form method="get" action="/" style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input className="input" name="token" placeholder="Cole o código de consulta" defaultValue={token} autoComplete="off" />
            <button type="submit" className="btn-primary" style={{ justifyContent: "center", padding: "0.75rem" }}>Consultar veículo</button>
          </form>
          {invalido && <div className="alert-error" style={{ maxWidth: 520, margin: "0.75rem auto 0", textAlign: "left" }}>Código inválido ou veículo não encontrado.</div>}
        </div>

        {resultado && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-soft)", textTransform: "uppercase" }}>Veículo</div>
              <div style={{ fontSize: "2rem", fontWeight: 800 }}>{formatPlaca(resultado.placa)}</div>
              <div style={{ color: "var(--text-soft)" }}>{resultado.modelo}</div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--text-soft)" }}>
                <span>Quilometragem: {formatKm(resultado.km_atual)}</span>
                <span>Oficina: {resultado.loja?.nome}</span>
              </div>
              {resultado.km_proxima_revisao && <div style={{ marginTop: "0.9rem", background: "var(--amber-dim)", border: "1px solid var(--amber)", borderRadius: 6, padding: "0.6rem 0.9rem", fontSize: "0.82rem", color: "var(--amber)" }}>{resultado.nota_proxima_revisao ?? "Próxima revisão"}: {formatKm(resultado.km_proxima_revisao)}</div>}
            </div>
            <div className="card" style={{ padding: "1rem 1.25rem" }}>
              <div className="section-heading" style={{ marginBottom: "1rem" }}>Histórico autorizado</div>
              {resultado.ordens_servico.length === 0 && <p style={{ color: "var(--text-soft)", fontSize: "0.875rem" }}>Nenhuma manutenção registrada.</p>}
              {resultado.ordens_servico.map((os, i) => (
                <div key={`${os.criado_em}-${i}`} style={{ padding: "0.75rem 0", borderBottom: i < resultado.ordens_servico.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <strong>{TIPO_SERVICO_LABEL[os.tipo_servico]}</strong>
                  <div style={{ display: "flex", gap: "1rem", marginTop: 4, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <span>{formatData(os.criado_em)}</span><span>{formatKm(os.km_no_servico)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
