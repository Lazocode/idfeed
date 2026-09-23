/**
 * @file criar-conta-form.tsx
 * @description Formulário interativo para credenciamento de oficinas e seus usuários técnicos.
 * Implementa máscaras em tempo real para CPF, CNPJ e telefones (com suporte a +55),
 * validação defensiva e exibição de mensagens de erro sem quebra ou recarregamento de página.
 * @module components/criar-conta-form
 * @recommendedPath src/components/criar-conta-form.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";

// 2. Ações e utilitários internos
import { criarContaLojaAction } from "@/actions/conta";

/**
 * Aplica máscara de CPF no formato 000.000.000-00 em tempo real.
 *
 * @param valor - String digitada pelo usuário.
 * @returns String formatada com pontos e traço.
 */
function formatarCpfInput(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, "").slice(0, 11);
  if (apenasNumeros.length <= 3) return apenasNumeros;
  if (apenasNumeros.length <= 6) return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
  if (apenasNumeros.length <= 9) {
    return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6)}`;
  }
  return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9)}`;
}

/**
 * Aplica máscara de CNPJ no formato 00.000.000/0000-00 em tempo real.
 *
 * @param valor - String digitada pelo usuário.
 * @returns String formatada com pontos, barra e traço.
 */
function formatarCnpjInput(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, "").slice(0, 14);
  if (apenasNumeros.length <= 2) return apenasNumeros;
  if (apenasNumeros.length <= 5) return `${apenasNumeros.slice(0, 2)}.${apenasNumeros.slice(2)}`;
  if (apenasNumeros.length <= 8) {
    return `${apenasNumeros.slice(0, 2)}.${apenasNumeros.slice(2, 5)}.${apenasNumeros.slice(5)}`;
  }
  if (apenasNumeros.length <= 12) {
    return `${apenasNumeros.slice(0, 2)}.${apenasNumeros.slice(2, 5)}.${apenasNumeros.slice(5, 8)}/${apenasNumeros.slice(8)}`;
  }
  return `${apenasNumeros.slice(0, 2)}.${apenasNumeros.slice(2, 5)}.${apenasNumeros.slice(5, 8)}/${apenasNumeros.slice(8, 12)}-${apenasNumeros.slice(12)}`;
}

/**
 * Aplica máscara telefônica dinâmica para celular ou fixo com DDD,
 * suportando prefixo internacional +55 sem causar truncamento ou falha.
 *
 * @param valor - String crua digitada ou colada pelo usuário.
 * @returns Telefone formatado no padrão (00) 00000-0000 ou (00) 0000-0000.
 */
function formatarTelefoneInput(valor: string): string {
  if (!valor) return "";

  const trimmed = valor.trim();
  if (trimmed === "+" || trimmed === "+5" || trimmed === "+55") {
    return trimmed === "+55" ? "+55 " : trimmed;
  }

  let digitos = valor.replace(/\D/g, "");

  // Se o usuário digitou ou colou com DDI +55:
  if (digitos.startsWith("55") && (digitos.length > 11 || (valor.includes("+") && digitos.length > 2))) {
    digitos = digitos.slice(2);
  }

  const apenasNumeros = digitos.slice(0, 11);
  if (apenasNumeros.length === 0) return "";
  if (apenasNumeros.length <= 2) return `(${apenasNumeros}`;
  if (apenasNumeros.length <= 6) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
  if (apenasNumeros.length <= 10) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
  }
  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
}

/**
 * Componente do formulário interativo de cadastro de oficina mecânica.
 *
 * @returns Elemento JSX com os campos estruturados de credenciamento.
 */
export default function CriarContaForm() {
  const router = useRouter();

  // Estados dos campos de dados pessoais do responsável
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  // Estados dos campos de dados da oficina
  const [nomeLoja, setNomeLoja] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefoneLoja, setTelefoneLoja] = useState("");

  // Estados dos campos de credenciais
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Estados de controle da interface
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Processa o envio assíncrono do formulário para a Server Action com tratamento de erros.
   *
   * @param e - Evento de envio do formulário HTML.
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    // Validação preliminar no lado do cliente
    if (senha.length < 10) {
      setErro("A senha deve possuir pelo menos 10 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("A confirmação de senha não confere com a senha informada.");
      return;
    }

    setLoading(true);

    try {
      const res = await criarContaLojaAction({
        nomeLoja: nomeLoja.trim(),
        nome: nome.trim(),
        cpf: cpf.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        cnpj: cnpj.trim(),
        telefoneLoja: telefoneLoja.trim(),
        senha,
        confirmarSenha,
      });

      if (!res.sucesso) {
        setErro(res.erro || "Não foi possível concluir o cadastro. Verifique os dados informados.");
        setLoading(false);
        return;
      }

      // Redireciona com feedback de sucesso
      router.push("/loja/login?criada=1");
    } catch {
      setErro("Ocorreu uma falha de conexão ao enviar os dados. Tente novamente em instantes.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Alerta de erro estruturado */}
      {erro && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{erro}</div>
        </div>
      )}

      {/* SEÇÃO: DADOS DO RESPONSÁVEL */}
      <div>
        <div className="pb-2 mb-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Dados do Responsável
          </span>
        </div>

        <div className="space-y-3.5">
          <div>
            <label
              htmlFor="cad-nome"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Nome completo do responsável *
            </label>
            <input
              id="cad-nome"
              name="nome"
              value={nome}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setNome(e.target.value);
                if (erro) setErro(null);
              }}
              required
              maxLength={100}
              placeholder="Ex: Carlos Eduardo da Silva"
              autoComplete="name"
              disabled={loading}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="cad-cpf"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                CPF do responsável *
              </label>
              <input
                id="cad-cpf"
                name="cpf"
                value={cpf}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCpf(formatarCpfInput(e.target.value));
                  if (erro) setErro(null);
                }}
                required
                maxLength={14}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                disabled={loading}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-mono text-xs sm:text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label
                htmlFor="cad-telefone"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Telefone celular (WhatsApp) *
              </label>
              <input
                id="cad-telefone"
                name="telefone"
                value={telefone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setTelefone(formatarTelefoneInput(e.target.value));
                  if (erro) setErro(null);
                }}
                required
                maxLength={25}
                placeholder="(21) 98888-7777"
                inputMode="tel"
                autoComplete="tel"
                disabled={loading}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-mono text-xs sm:text-sm disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="cad-email"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              E-mail corporativo ou pessoal *
            </label>
            <input
              id="cad-email"
              type="email"
              name="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);
                if (erro) setErro(null);
              }}
              required
              maxLength={254}
              placeholder="oficina@exemplo.com.br"
              autoComplete="email"
              disabled={loading}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO: DADOS DA OFICINA */}
      <div>
        <div className="pb-2 mb-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Dados da Oficina
          </span>
        </div>

        <div className="space-y-3.5">
          <div>
            <label
              htmlFor="cad-nomeloja"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Nome fantasia da oficina *
            </label>
            <input
              id="cad-nomeloja"
              name="nomeLoja"
              value={nomeLoja}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setNomeLoja(e.target.value);
                if (erro) setErro(null);
              }}
              required
              maxLength={100}
              placeholder="Ex: Auto Center Mecânica Silva"
              autoComplete="organization"
              disabled={loading}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="cad-cnpj"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                CNPJ *
              </label>
              <input
                id="cad-cnpj"
                name="cnpj"
                value={cnpj}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCnpj(formatarCnpjInput(e.target.value));
                  if (erro) setErro(null);
                }}
                required
                maxLength={18}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                autoComplete="off"
                disabled={loading}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-mono text-xs sm:text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label
                htmlFor="cad-telefoneloja"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Telefone da oficina *
              </label>
              <input
                id="cad-telefoneloja"
                name="telefoneLoja"
                value={telefoneLoja}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setTelefoneLoja(formatarTelefoneInput(e.target.value));
                  if (erro) setErro(null);
                }}
                required
                maxLength={25}
                placeholder="(21) 3333-3333"
                inputMode="tel"
                autoComplete="tel"
                disabled={loading}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-mono text-xs sm:text-sm disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO: SENHA */}
      <div>
        <div className="pb-2 mb-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Segurança de Acesso
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="cad-senha"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Senha (mínimo 10 carac.) *
            </label>
            <input
              id="cad-senha"
              type="password"
              name="senha"
              value={senha}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSenha(e.target.value);
                if (erro) setErro(null);
              }}
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              placeholder="••••••••••"
              disabled={loading}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60"
            />
          </div>
          <div>
            <label
              htmlFor="cad-confirmarsenha"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Confirmar senha *
            </label>
            <input
              id="cad-confirmarsenha"
              type="password"
              name="confirmarSenha"
              value={confirmarSenha}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setConfirmarSenha(e.target.value);
                if (erro) setErro(null);
              }}
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              placeholder="••••••••••"
              disabled={loading}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <button
        id="btn-criar-conta-submit"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs cursor-pointer mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
            <span>Processando credenciamento...</span>
          </>
        ) : (
          <>
            <span>Finalizar Cadastro da Oficina</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </>
        )}
      </button>

      <div className="mt-6 text-center">
        <Link
          href="/loja/login"
          className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          Já possui credenciais cadastradas? Fazer login
        </Link>
      </div>
    </form>
  );
}
