import Link from "next/link";
import { criarMaterial } from "@/actions/materiais";

export default function NovoMaterialPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div className="brand">L<span>O</span>TE</div>
        <Link href="/loja/dashboard" className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Painel</Link>
      </div>
      <div className="page-shell">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div className="icon-wrap icon-green" style={{ width: 40, height: 40, borderRadius: 10 }}></div>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Novo material</h1>
            <p style={{ color: "var(--text-soft)", fontSize: "0.8rem", margin: 0 }}>Cadastro de peça ou insumo</p>
          </div>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <form action={criarMaterial} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label">Nome *</label>
                <input className="input" name="nome" placeholder="Ex: Pastilha de Freio (par)" required />
              </div>
              <div>
                <label className="label">SKU / código *</label>
                <input className="input" name="sku" placeholder="Ex: PST-FRE-01" required />
              </div>
            </div>
            <div>
              <label className="label">Localização</label>
              <input className="input" name="localizacao" placeholder="Ex: Galpão 2 · Prateleira B2" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label">Quantidade inicial</label>
                <input className="input" name="quantidadeAtual" type="number" min={0} placeholder="0" />
              </div>
              <div>
                <label className="label">Estoque mínimo (alerta)</label>
                <input className="input" name="quantidadeMinima" type="number" min={0} placeholder="5" />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button type="submit" className="btn-primary">Cadastrar material</button>
              <Link href="/loja/dashboard" className="btn-ghost">Cancelar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
