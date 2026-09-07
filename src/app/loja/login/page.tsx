import LoginForm from "./login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-panel-heading">
            <span className="eyebrow">Acesso restrito</span>
            <h2>Entrar no painel</h2>
            <p>Use suas credenciais para acessar a gestão da loja.</p>
          </div>

          <div className="login-card">
            <LoginForm />
            <div className="divider" />
            <Link href="/loja/criar-conta" className="login-back-link" style={{ display: "block", textAlign: "center", marginBottom: "0.75rem" }}>Criar minha conta</Link>
            <Link href="/" className="login-back-link">
              ← Voltar para consulta de veículo
            </Link>
          </div>

          <div className="login-help">
            <span className="login-help-dot" />
            Ambiente seguro para gestão da operação
          </div>
        </div>
      </section>
    </main>
  );
}
