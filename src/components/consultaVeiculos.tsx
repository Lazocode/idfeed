/**
 * @file consultaVeiculos.tsx
 * @description Componente público para consulta de prontuário veicular digital com autenticação cruzada (Placa e CPF).
 * Apresenta odômetro oficial, próxima revisão preventiva, certificação de autenticidade e histórico de ordens de serviço.
 * @module components/consultaVeiculos
 * @recommendedPath src/components/consultaVeiculos.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState } from "react";
import {
  Search,
  ShieldCheck,
  Calendar,
  Gauge,
  Wrench,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Car,
  FileCheck2,
  Clock,
  Zap,
} from "lucide-react";

// 2. Ações de servidor (Server Actions)
import { ConsultarVeiculo } from "@/actions/consultaVeiculo";

// 3. Utilitários e formatadores internos
import {
  formatKm,
  formatData,
  TIPO_SERVICO_LABEL,
} from "@/lib/utils";

/**
 * Resumo de ordem de serviço retornada na consulta veicular pública.
 */
interface OrdemServicoConsulta {
  criado_em: string;
  tipo_servico: keyof typeof TIPO_SERVICO_LABEL;
  km_no_servico: number;
}

/**
 * Prontuário digital veicular completo retornado para o proprietário.
 */
interface VeiculoConsulta {
  id: string;
  placa: string;
  modelo: string;
  proprietario_nome?: string;
  km_atual: number;
  km_proxima_revisao: number | null;
  nota_proxima_revisao: string | null;
  loja: { nome: string } | { nome: string }[] | null;
  ordens_servico: OrdemServicoConsulta[];
}

/**
 * Aplica máscara visual de CPF (000.000.000-00) em tempo real durante a digitação.
 *
 * @param value - Sequência numérica ou formatada de entrada.
 * @returns String formatada com pontos e traço.
 */
function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Seleciona o ícone representativo com base no tipo de intervenção mecânica realizada.
 *
 * @param tipo - Código do tipo de serviço mecânico.
 * @returns Elemento JSX com o ícone colorido apropriado.
 */
function getServiceIcon(tipo: string): React.JSX.Element {
  switch (tipo) {
    case "oleo":
      return <Wrench className="w-4 h-4 text-amber-600" />;
    case "freios":
      return <ShieldCheck className="w-4 h-4 text-red-600" />;
    case "revisao":
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    case "eletrica":
      return <Zap className="w-4 h-4 text-blue-600" />;
    default:
      return <Wrench className="w-4 h-4 text-slate-600" />;
  }
}

/**
 * Componente cliente para consulta e emissão do prontuário digital veicular.
 *
 * @returns Formulário de consulta e visualização completa do histórico veicular certificado.
 */
export default function ConsultaVeiculo() {
  const [placa, setPlaca] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [veiculo, setVeiculo] = useState<VeiculoConsulta | null>(null);

  /**
   * Normaliza a placa para caracteres alfanuméricos em caixa alta (máximo 7 caracteres).
   */
  function handlePlacaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setPlaca(raw.slice(0, 7));
  }

  /**
   * Atualiza o estado do CPF aplicando a máscara pontuada automaticamente.
   */
  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(maskCpf(e.target.value));
  }

  /**
   * Limpa o estado da consulta e redefine os campos do formulário para nova busca.
   */
  function handleReset() {
    setVeiculo(null);
    setErro("");
    setPlaca("");
    setCpf("");
  }

  /**
   * Aciona a caixa de diálogo nativa de impressão/salvamento em PDF do navegador.
   */
  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  /**
   * Processa a busca do prontuário enviando placa e CPF validados para a Server Action.
   */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setVeiculo(null);

    const cleanPlaca = placa.replace(/[^A-Z0-9]/g, "");
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanPlaca.length !== 7) {
      setErro("A placa deve conter 7 caracteres alfanuméricos (ex: ABC1D23 ou ABC1234).");
      return;
    }

    if (cleanCpf.length !== 11) {
      setErro("O CPF deve conter os 11 dígitos cadastrados na ordem de serviço.");
      return;
    }

    setLoading(true);

    try {
      const resultado = await ConsultarVeiculo(cleanPlaca, cleanCpf);

      if (resultado.erro || !resultado.veiculo) {
        setErro(
          resultado.erro ||
            "Placa e CPF não foram encontrados na base de veículos homologados."
        );
      } else {
        setVeiculo(resultado.veiculo as unknown as VeiculoConsulta);
      }
    } catch (error) {
      console.error(error);
      setErro("Falha temporária de conexão com o banco de dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Resolução segura do nome da oficina mecânica emissora
  const oficinaNome = veiculo
    ? Array.isArray(veiculo.loja)
      ? veiculo.loja[0]?.nome
      : veiculo.loja?.nome
    : null;

  return (
    <div className="w-full">
      {/* ─── FORMULÁRIO DE CONSULTA ─── */}
      {!veiculo && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 text-left">
          <div className="pb-4 mb-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Identificação do Veículo
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Informe a placa do veículo e o CPF do proprietário registrado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campo da Placa */}
              <div>
                <label
                  htmlFor="placa"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Placa do Veículo
                </label>
                <div className="relative">
                  <input
                    id="placa"
                    type="text"
                    placeholder="Ex: ABC1D23"
                    value={placa}
                    onChange={handlePlacaChange}
                    maxLength={7}
                    autoComplete="off"
                    required
                    className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-blue-600 rounded-lg px-3.5 py-2.5 text-base font-mono font-semibold tracking-wider outline-none transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Car className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Padrão Mercosul ou anterior (7 caracteres)
                </p>
              </div>

              {/* Campo do CPF */}
              <div>
                <label
                  htmlFor="cpf"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  CPF do Titular
                </label>
                <div className="relative">
                  <input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    className="w-full bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-blue-600 rounded-lg px-3.5 py-2.5 text-base font-mono font-medium tracking-wide outline-none transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Apenas dígitos cadastrados na oficina
                </p>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div
                id="consulta-error"
                className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-red-900 text-xs">Registro não encontrado</p>
                  <p className="text-xs text-red-700 leading-relaxed">{erro}</p>
                </div>
              </div>
            )}

            {/* Botão de Consulta */}
            <button
              id="btn-consultar-veiculo"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm py-3 px-5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Buscando prontuário...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-slate-300" />
                  Consultar Prontuário
                </>
              )}
            </button>
          </form>

          {/* Garantias de Segurança */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500 text-xs">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <p>Acesso restrito ao proprietário legal</p>
            </div>
            <p>Conforme Lei Geral de Proteção de Dados (LGPD)</p>
          </div>
        </div>
      )}

      {/* ─── RESULTADO: PRONTUÁRIO DIGITAL DO VEÍCULO ─── */}
      {veiculo && (
        <div id="prontuario-veiculo" className="space-y-6 text-left animate-in fade-in duration-200">
          {/* Barra de Ações Superior */}
          <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Prontuário Veicular Oficial
                  </strong>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Registro Ativo
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Emitido em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="btn-imprimir-prontuario"
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Imprimir ou salvar este prontuário em PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Imprimir / PDF
              </button>

              <button
                id="btn-nova-consulta-prontuario"
                type="button"
                onClick={handleReset}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Nova Consulta
              </button>
            </div>
          </div>

          {/* Cartão de Identidade do Veículo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Dados Cadastrais
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {veiculo.modelo}
                </h2>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-slate-600 pt-1">
                  {veiculo.proprietario_nome && (
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span className="text-slate-400">Proprietário:</span> {veiculo.proprietario_nome}
                    </div>
                  )}
                  {oficinaNome && (
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span className="text-slate-400">Oficina emissora:</span> {oficinaNome}
                    </div>
                  )}
                </div>
              </div>

              {/* Tag Limpa e Tipográfica da Placa */}
              <div className="self-start md:self-center shrink-0">
                <div className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-center min-w-32">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Placa
                  </p>
                  <p className="font-mono text-xl sm:text-2xl font-bold text-slate-900 tracking-wider">
                    {veiculo.placa}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de Indicadores Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              {/* Odômetro Atual */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <p>Último Odômetro</p>
                  <Gauge className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {formatKm(veiculo.km_atual)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Registrado na última ordem de serviço
                  </p>
                </div>
              </div>

              {/* Próxima Revisão */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <p>Próxima Manutenção</p>
                  <Calendar className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  {veiculo.km_proxima_revisao ? (
                    <>
                      <div className="text-2xl font-bold text-slate-900 tracking-tight">
                        {formatKm(veiculo.km_proxima_revisao)}
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        {veiculo.nota_proxima_revisao || "Revisão preventiva programada"}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-semibold text-slate-800">Não agendada</div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Sem pendências futuras cadastradas</p>
                    </>
                  )}
                </div>
              </div>

              {/* Autenticidade & Auditoria */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <p>Histórico de Ordens</p>
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">
                    {veiculo.ordens_servico.length} {veiculo.ordens_servico.length === 1 ? "registro" : "registros"}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lançamentos efetuados por oficinas credenciadas
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico Cronológico de Manutenções */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  Histórico de Serviços Realizados
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registros cronológicos discriminados no encerramento de cada ordem de serviço.
                </p>
              </div>

              <span className="px-2.5 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700 border border-slate-200">
                {veiculo.ordens_servico.length} {veiculo.ordens_servico.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {veiculo.ordens_servico.length === 0 ? (
              <div className="py-8 text-center rounded-lg bg-slate-50 border border-slate-200">
                <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Nenhuma ordem de serviço registrada
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Este veículo está registrado na base. À medida que intervenções mecânicas forem finalizadas na oficina, o histórico será atualizado.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {veiculo.ordens_servico.map((os, index) => {
                  const labelServico =
                    TIPO_SERVICO_LABEL[os.tipo_servico] || "Serviço Mecânico";

                  return (
                    <div
                      key={`${os.criado_em}-${index}`}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-600">
                          {getServiceIcon(os.tipo_servico)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {labelServico}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatData(os.criado_em)}
                            </div>
                            <div className="flex items-center gap-1 text-slate-700">
                              <Gauge className="w-3.5 h-3.5 text-slate-400" />
                              Km aferida: {formatKm(os.km_no_servico)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                          Finalizado
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rodapé do Prontuário */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-xs">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <p>Prontuário mantido e auditado pelo sistema IDfeed</p>
              </div>
              <button
                id="btn-outra-consulta-rodape"
                type="button"
                onClick={handleReset}
                className="no-print text-slate-700 hover:text-slate-900 font-medium cursor-pointer"
              >
                Nova consulta →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

