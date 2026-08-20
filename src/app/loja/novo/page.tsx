import Link from "next/link";

export default function NovoRegistroPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div className="brand">L<span>O</span>TE</div>
        <Link href="/loja/dashboard" className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Painel</Link>
      </div>
      <div className="page-shell">
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.4rem" }}>Novo registro</h1>
        <p style={{ color: "var(--text-soft)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          O que você quer cadastrar?
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          <Link href="/loja/veiculo/novo" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card card-blue" style={{ padding: "1.5rem", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-raised)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}></div>
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>Veículo novo</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-soft)" }}>Cadastre um veículo que chegou na loja pela primeira vez</div>
            </div>
          </Link>
          <Link href="/loja/material/novo" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card card-green" style={{ padding: "1.5rem", cursor: "pointer", transition: "background 0.15s" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}></div>
              <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>Material novo</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-soft)" }}>Adicione uma peça ou insumo que ainda não está no estoque</div>
            </div>
          </Link>
        </div>
        <p style={{ marginTop: "1.5rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
          Para registrar uma manutenção ou movimentação de algo que já existe, abra o item no painel e use o botão dentro do histórico dele.
        </p>
      </div>
    </div>
  );
}
