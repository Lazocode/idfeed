/**
 * @file cadastrar-veiculo-form.tsx
 * @description Formulário interativo client-side para cadastro de veículos e emissão de passaporte digital.
 * Implementa máscaras em tempo real para placa, CPF e telefone, validação defensiva e tratamento de erros
 * sem recarregar ou travar a aplicação em caso de inconsistência de dados ou falha de rede.
 * @module components/cadastrar-veiculo-form
 * @recommendedPath src/components/cadastrar-veiculo-form.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";

// 2. Componentes internos
// (não há subcomponentes adicionais necessários)

// 3. Hooks, utilitários, libs e serviços
import { cadastrarVeiculoAction } from "@/actions/veiculos";

/**
 * Interface tipada para o estado de erro do formulário.
 */
interface FormErrorState {
  mensagem: string;
  campo?: string;
}

/**
 * Aplica máscara de CPF no formato 000.000.000-00 em tempo real.
 *
 * @param valor - String crua digitada pelo usuário.
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
 * Aplica máscara e conversão em caixa alta para a placa do veículo (Mercosul ou padrão antigo).
 *
 * @param valor - String crua digitada pelo usuário.
 * @returns Placa normalizada em caixa alta, respeitando o limite de 8 caracteres (ex: ABC-1D23).
 */
function formatarPlacaInput(valor: string): string {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (limpo.length > 3) {
    return `${limpo.slice(0, 3)}-${limpo.slice(3)}`;
  }
  return limpo;
}

/**
 * Aplica máscara telefônica dinâmica para números de celular ou fixo com DDD.
 *
 * @param valor - String crua digitada pelo usuário.
 * @returns Telefone formatado no padrão (00) 00000-0000 ou (00) 0000-0000.
 */
function formatarTelefoneInput(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, "").slice(0, 11);
  if (apenasNumeros.length <= 2) return apenasNumeros.length ? `(${apenasNumeros}` : "";
  if (apenasNumeros.length <= 6) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
  if (apenasNumeros.length <= 10) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
  }
  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7)}`;
}

/**
 * Componente do Formulário Interativo de Cadastro de Veículo.
 *
 * @returns Formulário estilizado com feedback instantâneo de validação e estado de envio.
 */
export default function CadastrarVeiculoForm() {
  const router = useRouter();

  // Estados locais dos campos do formulário
  const [placa, setPlaca] = useState("");
  const [kmAtual, setKmAtual] = useState("");
  const [modelo, setModelo] = useState("");
  const [proprietarioNome, setProprietarioNome] = useState("");
  const [proprietarioCpf, setProprietarioCpf] = useState("");
  const [proprietarioContato, setProprietarioContato] = useState("");

  // Estados operacionais de envio e mensagens de resposta
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<FormErrorState | null>(null);
  const [sucesso, setSucesso] = useState(false);

  /**
   * Processa a alteração e aplicação de máscara no campo de placa.
   *
   * @param e - Evento de mudança de valor do input HTML.
   */
  function handlePlacaChange(e: ChangeEvent<HTMLInputElement>) {
    setPlaca(formatarPlacaInput(e.target.value));
    if (erro) setErro(null);
  }

  /**
   * Processa a alteração e aplicação de máscara no campo de CPF.
   *
   * @param e - Evento de mudança de valor do input HTML.
   */
  function handleCpfChange(e: ChangeEvent<HTMLInputElement>) {
    setProprietarioCpf(formatarCpfInput(e.target.value));
    if (erro) setErro(null);
  }

  /**
   * Processa a alteração e aplicação de máscara no campo de contato.
   *
   * @param e - Evento de mudança de valor do input HTML.
   */
  function handleContatoChange(e: ChangeEvent<HTMLInputElement>) {
    setProprietarioContato(formatarTelefoneInput(e.target.value));
    if (erro) setErro(null);
  }

  /**
   * Valida preliminarmente e despacha a requisição de cadastro do veículo para o servidor.
   *
   * @param e - Evento de submissão do formulário HTML.
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);

    // Validações básicas defensivas no client antes do envio
    const placaLimpa = placa.replace(/[^A-Z0-9]/gi, "");
    if (placaLimpa.length < 7) {
      setErro({ mensagem: "A placa deve conter 7 caracteres alfanuméricos (padrão Mercosul ou convencional)." });
      return;
    }

    const cpfLimpo = proprietarioCpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      setErro({ mensagem: "O CPF do proprietário deve conter exatamente 11 dígitos numéricos." });
      return;
    }

    if (!modelo.trim()) {
      setErro({ mensagem: "Por favor, informe a marca, modelo e versão do veículo." });
      return;
    }

    if (!proprietarioNome.trim()) {
      setErro({ mensagem: "Por favor, informe o nome completo do proprietário." });
      return;
    }

    setLoading(true);

    try {
      const km = kmAtual ? Number(kmAtual) : 0;

      const resultado = await cadastrarVeiculoAction({
        placa: placaLimpa,
        modelo: modelo.trim(),
        proprietarioNome: proprietarioNome.trim(),
        proprietarioCpf: cpfLimpo,
        proprietarioContato: proprietarioContato.trim(),
        kmAtual: isNaN(km) ? 0 : km,
      });

      if (!resultado.sucesso) {
        setLoading(false);
        setErro({ mensagem: resultado.erro || "Não foi possível cadastrar o veículo. Verifique os dados informados." });
        return;
      }

      setSucesso(true);
      // Redireciona o usuário para o prontuário do veículo recém-cadastrado
      router.push(`/loja/veiculo/${resultado.veiculoId}`);
    } catch (err: unknown) {
      console.error("Erro inesperado na submissão:", err);
      setLoading(false);
      setErro({
        mensagem: "Ocorreu uma falha de conexão com o servidor. Por favor, tente novamente em instantes.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Alerta de erro defensivo */}
      {erro && (
        <div
          id="alerta-erro-veiculo"
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Atenção ao preencher o cadastro</p>
            <p className="mt-0.5 text-rose-700 text-xs sm:text-sm">{erro.mensagem}</p>
          </div>
        </div>
      )}

      {/* Alerta de sucesso antes do redirecionamento */}
      {sucesso && (
        <div
          id="alerta-sucesso-veiculo"
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-sm"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium text-emerald-900">
            Veículo cadastrado com sucesso! Emitindo passaporte digital...
          </p>
        </div>
      )}

      {/* Seção 1: Identificação do Veículo */}
      <div>
        <div className="pb-2 mb-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Identificação do Veículo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="veic-placa"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Placa do Veículo *
            </label>
            <input
              id="veic-placa"
              name="placa"
              value={placa}
              onChange={handlePlacaChange}
              placeholder="ABC-1D23"
              required
              maxLength={8}
              disabled={loading || sucesso}
              className="w-full uppercase font-mono tracking-wider bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="veic-kmAtual"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Km Atual do Odômetro
            </label>
            <input
              id="veic-kmAtual"
              name="kmAtual"
              type="number"
              min={0}
              value={kmAtual}
              onChange={(e) => setKmAtual(e.target.value)}
              placeholder="Ex: 45000"
              disabled={loading || sucesso}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="veic-modelo"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Marca, Modelo e Versão *
          </label>
          <input
            id="veic-modelo"
            name="modelo"
            value={modelo}
            onChange={(e) => {
              setModelo(e.target.value);
              if (erro) setErro(null);
            }}
            placeholder="Ex: Fiat Strada 1.4 Endurance (2021)"
            required
            disabled={loading || sucesso}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Seção 2: Dados do Proprietário */}
      <div>
        <div className="pb-2 mb-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Dados do Proprietário
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="veic-proprietarioNome"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Nome Completo do Proprietário *
            </label>
            <input
              id="veic-proprietarioNome"
              name="proprietarioNome"
              value={proprietarioNome}
              onChange={(e) => {
                setProprietarioNome(e.target.value);
                if (erro) setErro(null);
              }}
              placeholder="Nome do cliente"
              required
              disabled={loading || sucesso}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="veic-proprietarioCpf"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                CPF do Proprietário *
              </label>
              <input
                id="veic-proprietarioCpf"
                name="proprietarioCpf"
                value={proprietarioCpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                required
                disabled={loading || sucesso}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed font-mono text-xs sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="veic-proprietarioContato"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Telefone ou WhatsApp
              </label>
              <input
                id="veic-proprietarioContato"
                name="proprietarioContato"
                value={proprietarioContato}
                onChange={handleContatoChange}
                placeholder="(21) 99999-9999"
                inputMode="tel"
                maxLength={15}
                disabled={loading || sucesso}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all disabled:opacity-60 disabled:cursor-not-allowed font-mono text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ações de envio */}
      <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
        <button
          id="btn-criar-veiculo-submit"
          type="submit"
          disabled={loading || sucesso}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
              <span>Cadastrando e emitindo passaporte...</span>
            </>
          ) : (
            <>
              <span>Cadastrar e Emitir Passaporte</span>
              <ArrowRight className="w-4 h-4 text-slate-300" />
            </>
          )}
        </button>
        <Link
          id="btn-criar-veiculo-cancelar"
          href="/loja/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
