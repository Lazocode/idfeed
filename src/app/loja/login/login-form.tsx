/**
 * @file login-form.tsx
 * @description Formulário interativo de autenticação da oficina mecânica.
 * Valida credenciais com NextAuth, consulta a situação cadastral da loja
 * e direciona o usuário para o dashboard ou fluxo de homologação documental.
 * @module app/loja/login/login-form
 * @recommendedPath src/app/loja/login/login-form.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";

/**
 * Componente funcional do Formulário de Login da Loja.
 *
 * @returns Interface do formulário com e-mail, senha e feedback de status.
 */
export default function LoginForm() {
  // Estados locais do formulário
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Processa o envio do formulário de autenticação da oficina.
   *
   * @param e - Evento de submissão do formulário HTML.
   * @returns Promessa assíncrona resolvida após autenticação e redirecionamento.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErro("");
    setLoading(true);

    try {
      // 1. Solicita autenticação de credenciais via NextAuth
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

      // 2. Obtém a sessão autenticada para verificar a situação de homologação da oficina
      const session = await getSession();
      const lojaStatus = session?.user?.lojaStatus;

      // 3. Define a rota de destino com base no status cadastral da oficina
      let targetUrl = "/loja/dashboard";
      if (
        lojaStatus === "pendente" ||
        lojaStatus === "rejeitada" ||
        lojaStatus === "reprovada" ||
        lojaStatus === "sem_documento"
      ) {
        targetUrl = "/loja/enviar-documento";
      }

      // 4. Efetua a transição de rota
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = targetUrl;
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      setLoading(false);
      setErro("Ocorreu um erro ao processar o login. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label
          htmlFor="loja-email"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          E-mail da oficina
        </label>
        <input
          id="loja-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seuemail@oficina.com"
          required
          autoComplete="email"
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
        />
      </div>

      <div>
        <label
          htmlFor="loja-senha"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Senha
        </label>
        <input
          id="loja-senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
        />
      </div>

      {erro && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{erro}</span>
        </div>
      )}

      <button
        id="btn-loja-login-submit"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-60 transition-all shadow-xs cursor-pointer mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Acessando...</span>
          </>
        ) : (
          <>
            <span>Entrar no Painel</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </>
        )}
      </button>
    </form>
  );
}

