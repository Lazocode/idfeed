import { requireRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import AprovacoesTabs from "@/components/aprovacoesTabs";

export const dynamic = "force-dynamic";

export default async function AprovacoesPage() {
  await requireRole(["admin"]);

  const { data: oficinas, error } = await supabaseAdmin
    .from("lojas")
    .select("id, nome, cnpj, telefone, status, criado_em")
    .in("status", ["pendente", "aprovada", "rejeitada"])
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
            Não foi possível carregar as oficinas.
          </p>
        </div>
      </main>
    );
  }

  const pendentes =
    oficinas?.filter((oficina) => oficina.status === "pendente") ?? [];

  const aprovadas =
    oficinas?.filter((oficina) => oficina.status === "aprovada") ?? [];

  const rejeitadas =
    oficinas?.filter((oficina) => oficina.status === "rejeitada") ?? [];

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
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "1.75rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 750,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Aprovações
          </h1>

          <p
            style={{
              color: "var(--text-soft)",
              marginTop: "0.4rem",
              fontSize: "0.9rem",
            }}
          >
            Gerencie os cadastros das oficinas.
          </p>
        </div>

        <AprovacoesTabs
          pendentes={pendentes}
          aprovadas={aprovadas}
          rejeitadas={rejeitadas}
        />
      </div>
    </main>
  );
}