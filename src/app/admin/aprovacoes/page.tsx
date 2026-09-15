import { requireAdmin } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import AprovacoesTabs from "@/components/aprovacoesTabs";
import LogoutButton from "@/components/logout-button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AprovacoesPage() {
  const session = await requireAdmin();

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
        {/* Barra superior administrativa */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            paddingBottom: "1.25rem",
            marginBottom: "1.75rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#0f172a",
                color: "#ffffff",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <span
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                }}
              >
                Painel Administrativo
              </span>
              <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                IDfeed • Gestão Central
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                fontSize: "0.82rem",
                color: "var(--text-soft)",
                background: "var(--card-bg, #ffffff)",
                padding: "0.35rem 0.75rem",
                borderRadius: 6,
                border: "1px solid var(--border)",
              }}
            >
              {session.user.email}
            </span>
            <Link
              href="/"
              className="btn-ghost"
              style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem" }}
            >
              Início
            </Link>
            <LogoutButton redirectTo="/admin/login" />
          </div>
        </header>

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
            Gerencie e analise os cadastros e documentações das oficinas.
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