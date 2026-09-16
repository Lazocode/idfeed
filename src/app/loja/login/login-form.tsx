"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";

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
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          E-mail da oficina
        </label>
        <input
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
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Senha
        </label>
        <input
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
