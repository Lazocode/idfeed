"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    const res = await signIn("credentials", { email, senha, redirect: false });
    setLoading(false);
    if (res?.error) { setErro("E-mail ou senha incorretos."); return; }
    router.push("/loja/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div>
        <label className="label">E-mail</label>
        <input className="input login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@oficina.com" required />
      </div>
      <div>
        <label className="label">Senha</label>
        <input className="input login-input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" required />
      </div>
      <button type="submit" className="btn-primary login-submit" disabled={loading}>
        <span>{loading ? "Entrando..." : "Entrar no painel"}</span>
        {!loading && <span aria-hidden="true">→</span>}
      </button>
      {erro && <div className="alert-error">{erro}</div>}
    </form>
  );
}
