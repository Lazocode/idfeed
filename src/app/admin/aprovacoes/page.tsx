import Link from "next/link";
import { requireRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AprovacoesPage() {
  await requireRole(["admin"]);

  const { data: oficinas, error } = await supabaseAdmin
    .from("lojas")
    .select("id, nome, cnpj, telefone, status, criado_em")
    .eq("status", "pendente")
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("ERRO AO BUSCAR OFICINAS:", error);

    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          padding: "2rem",
        }}
      >
        <div className="card" style={{ padding: "2rem" }}>
          <h1>Erro ao carregar aprovações</h1>
          <p style={{ color: "var(--text-soft)" }}>
            Não foi possível carregar as oficinas pendentes.
          </p>
        </div>
      </main>
    );
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
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <span className="eyebrow">ADMINISTRAÇÃO</span>

          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              margin: "0.5rem 0",
            }}
          >
            Aprovação de oficinas
          </h1>

          <p style={{ color: "var(--text-soft)" }}>
            Oficinas aguardando análise de cadastro e documentação.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div className="section-heading" style={{ marginBottom: 0 }}>
            Oficinas pendentes ({oficinas?.length ?? 0})
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          {(!oficinas || oficinas.length === 0) && (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "var(--text-soft)",
              }}
            >
              Nenhuma oficina aguardando aprovação.
            </div>
          )}

          {oficinas?.map((oficina) => (
            <div
              key={oficina.id}
              className="tbl-row"
              style={{
                padding: "1.25rem",
                gap: "1rem",
              }}
            >
              <div
                className="icon-wrap icon-blue"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  {oficina.nome}
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-soft)",
                    marginTop: "0.25rem",
                  }}
                >
                  CNPJ: {oficina.cnpj || "Não informado"}
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-soft)",
                  }}
                >
                  Telefone: {oficina.telefone || "Não informado"}
                </div>
              </div>

              <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span className="badge badge-amber">
                    Pendente
                  </span>

                  <Link
                    href={`/admin/aprovacoes/${oficina.id}`}
                    className="btn-ghost"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.45rem 0.75rem",
                    }}
                  >
                    Analisar
                  </Link>
                </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}