import { requireRole } from "@/lib/security";

export const dynamic = "force-dynamic";

export default async function EnviarDocumentoPage() {
  const session = await requireRole(["admin"]);

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
        }}
      >
        <span className="eyebrow">Cadastro da oficina</span>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            margin: "0.5rem 0",
          }}
        >
          Envie seu documento
        </h1>

        <p
          style={{
            color: "var(--text-soft)",
            lineHeight: 1.6,
            marginBottom: "1.5rem",
          }}
        >
          Para concluir o cadastro da oficina, envie um documento de
          identificação com foto. Nossa equipe analisará o documento antes
          de liberar o acesso ao sistema.
        </p>

        <form
          action="/api/documentos-oficina"
          method="post"
          encType="multipart/form-data"
        >
          <label className="label" htmlFor="documento">
            Documento com foto
          </label>

          <input
            id="documento"
            name="documento"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            style={{
              width: "100%",
              marginTop: "0.5rem",
            }}
          />

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "1.25rem",
              padding: "0.75rem",
            }}
          >
            Enviar documento
          </button>
        </form>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.75rem",
            marginTop: "1rem",
          }}
        >
          A análise pode levar até 24 horas.
        </p>
      </section>
    </main>
  );
}