import { requireRole } from "@/lib/security";
import EnviarDocumentoForm from "@/components/enviar-documento-form";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function EnviarDocumentoPage() {
  const session = await requireRole(["admin"]);

  const { data: documento } = await supabaseAdmin
    .from("documentos_oficina")
    .select("status, observacao, enviado_em")
    .eq("loja_id", session.user.lojaId)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const documentoRejeitado = documento?.status === "rejeitado";

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
        <span className="eyebrow">
          {documentoRejeitado ? "Documento rejeitado" : "Cadastro da oficina"}
        </span>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            margin: "0.5rem 0",
          }}
        >
          {documentoRejeitado
            ? "Corrija e envie novamente"
            : "Envie seu documento"}
        </h1>

        {documentoRejeitado ? (
          <>
            <p
              style={{
                color: "var(--text-soft)",
                lineHeight: 1.6,
                marginBottom: "1rem",
              }}
            >
              O documento enviado anteriormente foi rejeitado. Veja abaixo o
              motivo informado pela equipe:
            </p>

            <div
              style={{
                padding: "1rem",
                border: "1px solid #fecaca",
                borderRadius: 10,
                background: "#fef2f2",
                marginBottom: "1.5rem",
              }}
            >
              <strong style={{ display: "block", marginBottom: "0.35rem" }}>
                Motivo da rejeição
              </strong>

              <span
                style={{
                  color: "var(--text-soft)",
                  lineHeight: 1.5,
                }}
              >
                {documento.observacao || "Nenhum motivo informado."}
              </span>
            </div>

            <p
              style={{
                color: "var(--text-soft)",
                lineHeight: 1.6,
                marginBottom: "1.5rem",
              }}
            >
              Corrija o problema indicado e envie um novo documento para que
              nossa equipe possa realizar uma nova análise.
            </p>
          </>
        ) : (
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
        )}

        <EnviarDocumentoForm />

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