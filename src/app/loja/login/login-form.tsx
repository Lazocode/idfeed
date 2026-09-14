"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
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
        callbackUrl: "/loja/dashboard",
      });

      if (!res || res.error) {
        setLoading(false);
        setErro("E-mail ou senha incorretos.");
        return;
      }

      // Busca a sessão recém-criada para verificar o status da oficina
      const session = await getSession();
      const lojaStatus = (session?.user as { lojaStatus?: string })?.lojaStatus;

      let targetUrl = "/loja/dashboard";
      if (
        lojaStatus === "pendente" ||
        lojaStatus === "rejeitada" ||
        lojaStatus === "reprovada"
      ) {
        targetUrl = "/loja/enviar-documento";
      }

      // Redirecionamento completo do navegador para carregar com os cookies de sessão
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = targetUrl;
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      setLoading(false);
      setErro("Ocorreu um erro ao processar o login. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div>
        <label className="label">E-mail</label>

        <input
          className="input login-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seuemail@oficina.com"
          required
        />
      </div>

      <div>
        <label className="label">Senha</label>

        <input
          className="input login-input"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        className="btn-primary login-submit"
        disabled={loading}
      >
        <span>
          {loading ? "Entrando..." : "Entrar no painel"}
        </span>

        {!loading && (
          <span aria-hidden="true">
            →
          </span>
        )}
      </button>

      {erro && (
        <div className="alert-error">
          {erro}
        </div>
      )}
    </form>
  );
}
