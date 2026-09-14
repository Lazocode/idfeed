"use client";

import { useState, Suspense } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

function LoginFormInner() {
  const searchParams = useSearchParams();
  const erroParam = searchParams.get("erro");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(
    erroParam === "nao_autorizado"
      ? "Acesso restrito: sua conta não possui privilégios de administrador para acessar o painel de aprovações."
      : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        senha,
        redirect: false,
        callbackUrl: "/admin/aprovacoes",
      });

      if (!res || res.error) {
        setLoading(false);
        setErro("Credenciais inválidas. Verifique seu e-mail e senha.");
        return;
      }

      // Valida se o usuário autenticado realmente possui o papel de admin
      const session = await getSession();
      const papel = session?.user?.papel;

      if (papel !== "admin") {
        // Desconecta se o usuário logado não for admin
        await signOut({ redirect: false });
        setLoading(false);
        setErro(
          "Acesso negado: este perfil não possui privilégios de administrador geral."
        );
        return;
      }

      // Redireciona diretamente para o painel de aprovações
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/admin/aprovacoes";
    } catch (err) {
      console.error("Erro no login administrativo:", err);
      setLoading(false);
      setErro("Falha ao comunicar com o servidor. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {erro && (
        <div
          id="admin-login-error"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.6rem",
            padding: "0.85rem 1rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#b91c1c",
            fontSize: "0.86rem",
            marginBottom: "1.25rem",
            lineHeight: 1.45,
            textAlign: "left",
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{erro}</span>
        </div>
      )}

      <div style={{ marginBottom: "1.2rem", textAlign: "left" }}>
        <label
          htmlFor="admin-email"
          style={{
            display: "block",
            fontSize: "0.82rem",
            fontWeight: 600,
            marginBottom: "0.35rem",
            color: "var(--text)",
          }}
        >
          E-mail de Administrador
        </label>
        <input
          id="admin-email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="input-base"
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
        <label
          htmlFor="admin-senha"
          style={{
            display: "block",
            fontSize: "0.82rem",
            fontWeight: 600,
            marginBottom: "0.35rem",
            color: "var(--text)",
          }}
        >
          Senha de Acesso
        </label>
        <input
          id="admin-senha"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={loading}
          className="input-base"
          style={{ width: "100%" }}
        />
      </div>

      <button
        id="btn-admin-login-submit"
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Verificando credenciais...</span>
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            <span>Entrar no Painel Administrativo</span>
          </>
        )}
      </button>

      <div
        style={{
          marginTop: "1.75rem",
          paddingTop: "1.25rem",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          fontSize: "0.82rem",
        }}
      >
        <Link
          href="/loja/login"
          style={{
            color: "var(--text-soft)",
            textDecoration: "none",
          }}
        >
          É uma oficina parceira? <strong style={{ color: "var(--text)" }}>Acesse a área da loja</strong>
        </Link>
        <Link
          href="/"
          style={{
            color: "var(--text-soft)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
          }}
        >
          <ArrowLeft size={14} /> Voltar para o início
        </Link>
      </div>
    </form>
  );
}

export default function AdminLoginForm() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "2rem 0", textAlign: "center", color: "var(--text-soft)" }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
          Carregando formulário...
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
