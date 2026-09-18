/**
 * @file admin-login-form.tsx
 * @description Formulário de autenticação de administradores do IDfeed.
 * Realiza autenticação via credenciais NextAuth e valida se o usuário possui
 * os privilégios exclusivos de superadministrador (Lázaro Miranda).
 * @module app/admin/login/admin-login-form
 * @recommendedPath src/app/admin/login/admin-login-form.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import { useState, Suspense } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";

/**
 * Componente interno do formulário que consome os parâmetros da URL (`useSearchParams`).
 *
 * @returns Elemento JSX do formulário de login administrativo.
 */
function LoginFormInner() {
  const searchParams = useSearchParams();
  const erroParam = searchParams.get("erro");

  // Estados locais do formulário de autenticação
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(
    erroParam === "nao_autorizado"
      ? "Acesso restrito: sua conta não possui privilégios de administrador para acessar o painel de aprovações."
      : ""
  );
  const [loading, setLoading] = useState(false);

  /**
   * Manipula o envio do formulário de login e valida permissões de administrador.
   *
   * @param e - Evento de submissão do formulário HTML.
   * @returns Promessa assíncrona resolvida após autenticação e redirecionamento.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      // 1. Executa a autenticação via credenciais do NextAuth
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

      // 2. Obtém a sessão recém-criada para verificar as credenciais específicas de superadministrador
      const session = await getSession();
      const papel = session?.user?.papel;
      const sessionEmail = session?.user?.email?.toLowerCase() || "";
      const sessionNome = session?.user?.name?.toLowerCase() || "";
      const isLazaroAdmin =
        papel === "admin" &&
        (sessionEmail === "lazanha931@gmail.com" ||
          sessionEmail === "mirandalazaro560@gmail.com" ||
          sessionNome.includes("lazaro") ||
          sessionNome.includes("lázaro"));

      // 3. Se a conta não for o administrador geral autorizado, encerra a sessão imediatamente
      if (!isLazaroAdmin) {
        await signOut({ redirect: false });
        setLoading(false);
        setErro(
          "Acesso negado: este portal é restrito exclusivamente ao administrador geral Lázaro Miranda."
        );
        return;
      }

      // 4. Redireciona o administrador validado para a área de aprovação cadastral
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/admin/aprovacoes";
    } catch (err) {
      console.error("Erro no login administrativo:", err);
      setLoading(false);
      setErro("Falha ao comunicar com o servidor. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {erro && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
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
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
        />
      </div>

      <div>
        <label
          htmlFor="admin-senha"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
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
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
        />
      </div>

      <button
        id="btn-admin-login-submit"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-60 transition-all shadow-xs cursor-pointer mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verificando credenciais...</span>
          </>
        ) : (
          <>
            <span>Entrar no Painel Administrativo</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </>
        )}
      </button>

      <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-2 text-center text-xs">
        <Link
          href="/loja/login"
          className="text-slate-500 hover:text-slate-800 transition-colors"
        >
          É uma oficina credenciada? <strong className="text-slate-700">Acesse a área da loja</strong>
        </Link>
        <Link
          href="/"
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Voltar para a consulta pública
        </Link>
      </div>
    </form>
  );
}

/**
 * Componente principal do formulário de login do administrador com wrapper Suspense.
 *
 * @returns Interface do formulário encapsulada com fallback de carregamento.
 */
export default function AdminLoginForm() {
  return (
    <Suspense
      fallback={
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          <span>Carregando formulário...</span>
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}

