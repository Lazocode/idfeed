import ConsultaVeiculo from "@/components/consultaVeiculos";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Cabeçalho */}
      <header className="topbar">
        <div style={{ width: 90 }} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Link
            href="/loja/login"
            className="btn-ghost"
            style={{
              fontSize: "0.78rem",
              padding: "0.4rem 0.9rem",
            }}
          >
            Entrar
          </Link>

          <Link
            href="/loja/criar-conta"
            className="btn-primary"
            style={{
              fontSize: "0.78rem",
              padding: "0.4rem 0.9rem",
            }}
          >
            Criar conta
          </Link>
        </div>
      </header>

      {/* Conteúdo principal */}
      <section
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1.25rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "2rem",
            }}
          ></div>

          <img
            src="/idfeed-logo.jpg"
            alt="IDFeed - A identidade digital do seu veículo"
            style={{
            width: "100%",
            maxWidth: 360,
            height: "auto",
            display: "block",
            mixBlendMode: "multiply",
            opacity: 0.92,
            }}
          />

          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              margin: "0.5rem 0",
            }}
          >
            Consulte o histórico do veículo
          </h1>

          <p
            style={{
              color: "var(--text-soft)",
              fontSize: "0.95rem",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            Informe a placa e o CPF do proprietário para consultar as
            informações autorizadas do veículo.
          </p>

          {/* Formulário */}
          <ConsultaVeiculo />

          {/* Área de acesso da oficina */}
          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border)",
            }}
          >
            <p
              style={{
                color: "var(--text-soft)",
                fontSize: "0.85rem",
                marginBottom: "0.75rem",
              }}
            >
              Você possui uma oficina?
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/loja/login"
                className="btn-ghost"
              >
                Entrar na minha conta
              </Link>

              <Link
                href="/loja/criar-conta"
                className="btn-primary"
              >
                Cadastrar minha oficina
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}