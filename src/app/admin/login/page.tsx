import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isLazaroMirandaAdmin } from "@/lib/security";
import AdminLoginForm from "./admin-login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login Administrativo • LOTE",
  description: "Acesso restrito para administradores do sistema de aprovações.",
};

export default async function AdminLoginPage() {
  const session = await auth();

  // Se já estiver autenticado como o administrador geral Lázaro Miranda, vai direto para as aprovações
  if (session?.user?.id && isLazaroMirandaAdmin(session.user)) {
    redirect("/admin/aprovacoes");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "1.5rem",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "2.25rem 2rem",
          textAlign: "center",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "#f1f5f9",
            color: "#0f172a",
            marginBottom: "1.25rem",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <div style={{ marginBottom: "1.75rem" }}>
          <span
            className="badge"
            style={{
              display: "inline-block",
              background: "#e2e8f0",
              color: "#334155",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "0.2rem 0.6rem",
              borderRadius: 4,
              marginBottom: "0.6rem",
            }}
          >
            Acesso Restrito
          </span>

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 750,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--text)",
            }}
          >
            Portal do Administrador
          </h1>

          <p
            style={{
              color: "var(--text-soft)",
              fontSize: "0.88rem",
              marginTop: "0.4rem",
              lineHeight: 1.5,
            }}
          >
            Informe suas credenciais administrativas para gerenciar aprovações de oficinas.
          </p>
        </div>

        <AdminLoginForm />
      </div>
    </main>
  );
}
