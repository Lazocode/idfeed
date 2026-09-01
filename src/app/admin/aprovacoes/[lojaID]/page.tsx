import Link from "next/link";
import { requireRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AnaliseOficinaPage({
  params,
}: {
  params: Promise<{ lojaId: string }>;
}) {
  await requireRole(["admin"]);

  const { lojaId } = await params;

  const { data: loja, error: lojaError } = await supabaseAdmin
    .from("lojas")
    .select("id, nome, cnpj, telefone, status, criado_em")
    .eq("id", lojaId)
    .single();

  if (lojaError || !loja) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          padding: "2rem",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "2rem",
          }}
        >
          <h1>Oficina não encontrada</h1>

          <p
            style={{
              color: "var(--text-soft)",
              marginTop: "0.5rem",
            }}
          >
            Não foi possível encontrar os dados desta oficina.
          </p>

          <Link
            href="/admin/aprovacoes"
            className="btn-ghost"
            style={{
              display: "inline-flex",
              marginTop: "1.5rem",
            }}
          >
            Voltar para aprovações
          </Link>
        </div>
      </main>
    );
  }

  const { data: documentos, error: documentoError } = await supabaseAdmin
    .from("documentos_oficina")
    .select(
      "id, nome_arquivo, caminho_arquivo, status, criado_em"
    )
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });

  if (documentoError) {
    console.error(
      "ERRO AO BUSCAR DOCUMENTOS:",
      documentoError
    );
  }

  const documento = documentos?.[0];

  let documentoUrl: string | null = null;

  if (documento) {
    const { data } = await supabaseAdmin.storage
      .from("documentos-oficinas")
      .createSignedUrl(documento.caminho_arquivo, 60 * 10);

    documentoUrl = data?.signedUrl ?? null;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <Link
          href="/admin/aprovacoes"
          style={{
            color: "var(--blue)",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          ← Voltar para aprovações
        </Link>

        <div style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>
          <span className="eyebrow">ANÁLISE DA OFICINA</span>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              margin: "0.5rem 0",
            }}
          >
            {loja.nome}
          </h1>

          <p style={{ color: "var(--text-soft)" }}>
            Confira os dados e a documentação antes de liberar o
            acesso.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="section-heading">
              Dados da oficina
            </div>

            <div style={{ marginTop: "1rem" }}>
              <p>
                <strong>Nome:</strong> {loja.nome}
              </p>

              <p style={{ marginTop: "0.6rem" }}>
                <strong>CNPJ:</strong>{" "}
                {loja.cnpj || "Não informado"}
              </p>

              <p style={{ marginTop: "0.6rem" }}>
                <strong>Telefone:</strong>{" "}
                {loja.telefone || "Não informado"}
              </p>

              <p style={{ marginTop: "0.6rem" }}>
                <strong>Status:</strong>{" "}
                <span className="badge badge-amber">
                  {loja.status}
                </span>
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem" }}>
            <div className="section-heading">
              Documento enviado
            </div>

            {!documento && (
              <p
                style={{
                  marginTop: "1rem",
                  color: "var(--text-soft)",
                }}
              >
                Nenhum documento foi enviado.
              </p>
            )}

            {documento && (
              <div style={{ marginTop: "1rem" }}>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-soft)",
                  }}
                >
                  Arquivo:
                </p>

                <p
                  style={{
                    fontWeight: 700,
                    marginTop: "0.25rem",
                    wordBreak: "break-word",
                  }}
                >
                  {documento.nome_arquivo}
                </p>

                <span
                  className="badge badge-amber"
                  style={{
                    display: "inline-flex",
                    marginTop: "0.75rem",
                  }}
                >
                  {documento.status}
                </span>

                {documentoUrl && (
                  <div style={{ marginTop: "1.25rem" }}>
                    <a
                      href={documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{
                        display: "inline-flex",
                      }}
                    >
                      Visualizar documento
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="section-heading">
            Próxima etapa
          </div>

          <p
            style={{
              color: "var(--text-soft)",
              marginTop: "0.75rem",
              lineHeight: 1.6,
            }}
          >
            Depois de conferir os dados e o documento, você poderá
            aprovar ou rejeitar o cadastro da oficina.
          </p>
        </div>
      </div>
    </main>
  );
}