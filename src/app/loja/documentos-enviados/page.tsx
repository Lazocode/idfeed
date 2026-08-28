import Link from "next/link";

export default function DocumentoEnviadoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <section
        className="card"
        style={{
          width: "100%",
          maxWidth: 520,
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <span className="eyebrow">Documento recebido</span>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            margin: "0.5rem 0 1rem",
          }}
        >
          Documento enviado com sucesso!
        </h1>

        <p
          style={{
            color: "var(--text-soft)",
            lineHeight: 1.6,
          }}
        >
          Recebemos seu documento e ele está aguardando análise.
          Nossa equipe fará a verificação em até 24 horas.
        </p>

        <div
          style={{
            marginTop: "1.5rem",
            padding: "0.9rem",
            borderRadius: 8,
            background: "var(--amber-dim)",
            border: "1px solid var(--amber)",
            color: "var(--amber)",
            fontSize: "0.85rem",
          }}
        >
          Sua oficina permanece pendente até a conclusão da análise.
        </div>

        <Link
          href="/loja/login"
          className="btn-ghost"
          style={{
            display: "inline-flex",
            marginTop: "1.5rem",
          }}
        >
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}