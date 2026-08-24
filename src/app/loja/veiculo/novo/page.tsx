import Link from "next/link";
import { criarVeiculo } from "@/actions/veiculos";

export default function NovoVeiculoPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="topbar">
        <div className="brand">L<span>O</span>TE</div>
        <Link href="/loja/dashboard" className="btn-ghost" style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}>← Painel</Link>
      </div>
      <div className="page-shell">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div className="icon-wrap icon-blue" style={{ width: 40, height: 40, borderRadius: 10 }}></div>
          <div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0 }}>Novo veículo</h1>
            <p style={{ color: "var(--text-soft)", fontSize: "0.8rem", margin: 0 }}>Cadastro de equipamento</p>
          </div>
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <form action={criarVeiculo} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label">Placa *</label>
                <input className="input" name="placa" placeholder="ABC-1D23" required />
              </div>
              <div>
                <label className="label">Km atual</label>
                <input className="input" name="kmAtual" type="number" min={0} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="label">Modelo *</label>
              <input className="input" name="modelo" placeholder="Ex: Fiat Strada 1.4 Endurance (2021)" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="label">Proprietário *</label>
                <input className="input" name="proprietarioNome" placeholder="Nome do cliente" required />
              </div>
              <div>
                <label className="label">CPF do proprietário *</label>
                <input
                  className="input"
                  name="proprietarioCpf"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                  required
                />
              </div>
              <div>
                <label className="label">Contato</label>
                <input className="input" name="proprietarioContato" placeholder="Telefone ou e-mail" />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button type="submit" className="btn-primary">Cadastrar veículo</button>
              <Link href="/loja/dashboard" className="btn-ghost">Cancelar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
