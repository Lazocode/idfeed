import Link from "next/link";
import { criarContaLoja } from "@/actions/conta";

export default function CriarContaPage() {
  return (
    <main
      className="login-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--bg)",
      }}
    >
      <section
        className="login-card"
        style={{
          width: "100%",
          maxWidth: 560,
          padding: "2rem",
        }}
      >
        <div className="login-panel-heading">
          <span className="eyebrow">Novo acesso</span>

          <h2>Criar conta da oficina</h2>

          <p>
            Informe os dados do responsável e da oficina para iniciar o
            cadastro.
          </p>
        </div>

        <form action={criarContaLoja} className="login-form">
          {/* RESPONSÁVEL */}
          <div
            style={{
              marginBottom: "0.5rem",
              marginTop: "0.5rem",
            }}
          >
            <div className="section-heading">
              Dados do responsável
            </div>
          </div>

          <div>
            <label className="label">Nome completo</label>

            <input
              className="input login-input"
              name="nome"
              required
              maxLength={100}
              placeholder="Seu nome completo"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="label">CPF</label>

            <input
              className="input login-input"
              name="cpf"
              required
              maxLength={14}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="label">Telefone</label>

            <input
              className="input login-input"
              name="telefone"
              required
              maxLength={20}
              placeholder="(21) 99999-9999"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className="label">E-mail</label>

            <input
              className="input login-input"
              type="email"
              name="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="voce@oficina.com"
            />
          </div>

          {/* OFICINA */}
          <div
            style={{
              marginBottom: "0.5rem",
              marginTop: "1.25rem",
            }}
          >
            <div className="section-heading">
              Dados da oficina
            </div>
          </div>

          <div>
            <label className="label">Nome da oficina</label>

            <input
              className="input login-input"
              name="nomeLoja"
              required
              maxLength={100}
              placeholder="Minha Oficina"
              autoComplete="organization"
            />
          </div>

          <div>
            <label className="label">CNPJ</label>

            <input
              className="input login-input"
              name="cnpj"
              required
              maxLength={18}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="label">Telefone da oficina</label>

            <input
              className="input login-input"
              name="telefoneLoja"
              required
              maxLength={20}
              placeholder="(21) 3333-3333"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          {/* ACESSO */}
          <div
            style={{
              marginBottom: "0.5rem",
              marginTop: "1.25rem",
            }}
          >
            <div className="section-heading">
              Dados de acesso
            </div>
          </div>

          <div>
            <label className="label">Senha</label>

            <input
              className="input login-input"
              type="password"
              name="senha"
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Mínimo de 10 caracteres"
            />
          </div>

          <div>
            <label className="label">Confirmar senha</label>

            <input
              className="input login-input"
              type="password"
              name="confirmarSenha"
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
            />
          </div>

          <button
            type="submit"
            className="btn-primary login-submit"
          >
            Criar minha conta →
          </button>
        </form>

        <div className="divider" />

        <Link
          href="/loja/login"
          className="login-back-link"
        >
          ← Já tenho uma conta
        </Link>
      </section>
    </main>
  );
}