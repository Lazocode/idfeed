import Link from "next/link";
import { criarContaLoja } from "@/actions/conta";

export default function CriarContaPage() {
  return (
    <main className="login-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      <section className="login-card" style={{ width: "100%", maxWidth: 520, padding: "2rem" }}>
        <div className="login-panel-heading">
          <span className="eyebrow">Novo acesso</span>
          <h2>Criar conta da loja</h2>
          <p>Cadastre sua oficina e crie automaticamente o primeiro usuário administrador.</p>
        </div>
        <form action={criarContaLoja} className="login-form">
          <div><label className="label">Nome da loja</label><input className="input login-input" name="nomeLoja" required maxLength={100} placeholder="Minha Oficina" /></div>
          <div><label className="label">Seu nome</label><input className="input login-input" name="nome" required maxLength={100} placeholder="Seu nome completo" /></div>
          <div><label className="label">E-mail</label><input className="input login-input" type="email" name="email" required maxLength={254} autoComplete="email" placeholder="voce@oficina.com" /></div>
          <div><label className="label">Senha</label><input className="input login-input" type="password" name="senha" required minLength={10} maxLength={128} autoComplete="new-password" placeholder="Mínimo de 10 caracteres" /></div>
          <div><label className="label">Confirmar senha</label><input className="input login-input" type="password" name="confirmarSenha" required minLength={10} maxLength={128} autoComplete="new-password" placeholder="Digite a senha novamente" /></div>
          <button type="submit" className="btn-primary login-submit">Criar minha conta →</button>
        </form>
        <div className="divider" />
        <Link href="/loja/login" className="login-back-link">← Já tenho uma conta</Link>
      </section>
    </main>
  );
}
