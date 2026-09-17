"use client";

import { useState } from "react";
import { ConsultarVeiculo } from "@/actions/consultaVeiculo";
import {
  formatKm,
  formatData,
  TIPO_SERVICO_LABEL,
} from "@/lib/utils";
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
  Sparkles,
  Zap,
} from "lucide-react";

interface OrdemServicoConsulta {
  criado_em: string;
  tipo_servico: keyof typeof TIPO_SERVICO_LABEL;
  km_no_servico: number;
}

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

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function getServiceIcon(tipo: string) {
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

export default function ConsultaVeiculo() {
  const [placa, setPlaca] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [veiculo, setVeiculo] = useState<VeiculoConsulta | null>(null);

  function handlePlacaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setPlaca(raw.slice(0, 7));
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(maskCpf(e.target.value));
  }

  function handleReset() {
    setVeiculo(null);
    setErro("");
    setPlaca("");
    setCpf("");
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

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

  const oficinaNome = veiculo
    ? Array.isArray(veiculo.loja)
      ? veiculo.loja[0]?.nome
      : veiculo.loja?.nome
    : null;

  return (
    <div className="w-full">
      {/* ─── FORMULÁRIO DE CONSULTA ─── */}
      {!veiculo && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-left transition-all">
          <div className="pb-5 mb-6 border-b border-slate-100">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Identificação do Veículo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Validação criptográfica cruzada entre proprietário e histórico veicular.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Campo da Placa */}
              <div>
                <label
                  htmlFor="placa"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
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
                    className="w-full bg-slate-50/60 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-3 text-base font-mono font-semibold tracking-wider transition-all duration-150 outline-none focus:ring-3 focus:ring-blue-500/10"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Car className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mercosul ou padrão cinza (7 caracteres)
                </p>
              </div>

              {/* Campo do CPF */}
              <div>
                <label
                  htmlFor="cpf"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  CPF do Proprietário
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
                    className="w-full bg-slate-50/60 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-3 text-base font-mono font-medium tracking-wide transition-all duration-150 outline-none focus:ring-3 focus:ring-blue-500/10"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Somente números cadastrados na oficina
                </p>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div
                id="consulta-error"
                className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50/90 border border-red-200/80 text-red-800 text-sm animate-in fade-in"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-red-900">Não foi possível localizar o prontuário</p>
                  <p className="text-xs text-red-700 leading-relaxed">{erro}</p>
                </div>
              </div>
            )}

            {/* Botão de Consulta */}
            <button
              id="btn-consultar-veiculo"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-xs hover:shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Consultando base da rede homologada...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-slate-300" />
                  Consultar Histórico Completo
                </>
              )}
            </button>
          </form>

          {/* Garantias de Segurança */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <p>Proteção criptográfica ponta a ponta (HMAC-SHA256)</p>
            </div>
            <p>Em conformidade com a LGPD</p>
          </div>
        </div>
      )}

      {/* ─── RESULTADO: PRONTUÁRIO DIGITAL DO VEÍCULO ─── */}
      {veiculo && (
        <div id="prontuario-veiculo" className="space-y-6 text-left animate-in fade-in duration-200">
          {/* Barra de Ações Superior */}
          <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Dossiê Veicular Ativo
                  </strong>
                  <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Homologado
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Prontuário emitido em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Imprimir ou salvar este prontuário em PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Imprimir / PDF
              </button>

              <button
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
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                  Veículo Homologado na Rede IDfeed
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
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

              {/* Tag Limpa e Tipográfica da Placa (Sem desenho de chapa) */}
              <div className="self-start md:self-center shrink-0">
                <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-center min-w-32">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Placa
                  </p>
                  <p className="font-mono text-xl sm:text-2xl font-black text-slate-900 tracking-wider">
                    {veiculo.placa}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid de Indicadores Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              {/* Odômetro Atual */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <p>Odômetro Registrado</p>
                  <Gauge className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatKm(veiculo.km_atual)}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Aferido na última passagem pela oficina
                  </p>
                </div>
              </div>

              {/* Próxima Revisão */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-amber-900 text-xs font-semibold uppercase tracking-wider">
                  <p>Próxima Manutenção</p>
                  <Calendar className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  {veiculo.km_proxima_revisao ? (
                    <>
                      <div className="text-2xl font-black text-amber-950 tracking-tight">
                        {formatKm(veiculo.km_proxima_revisao)}
                      </div>
                      <p className="text-[11px] text-amber-800 font-medium truncate mt-0.5">
                        {veiculo.nota_proxima_revisao || "Revisão preventiva programada"}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-amber-900">Em dia</div>
                      <p className="text-[11px] text-amber-700 mt-0.5">Sem agendamentos futuros pendentes</p>
                    </>
                  )}
                </div>
              </div>

              {/* Autenticidade & Auditoria */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-emerald-900 text-xs font-semibold uppercase tracking-wider">
                  <p>Status do Prontuário</p>
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-950 tracking-tight">
                    Auditado
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                    {veiculo.ordens_servico.length} {veiculo.ordens_servico.length === 1 ? "registro cadastrado" : "registros cadastrados"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico Cronológico de Manutenções */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-700" />
                  Histórico Oficial de Manutenções
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Registros cronológicos efetuados pelas oficinas no encerramento de cada ordem de serviço.
                </p>
              </div>

              <div className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                {veiculo.ordens_servico.length} {veiculo.ordens_servico.length === 1 ? "ordem" : "ordens"}
              </div>
            </div>

            {veiculo.ordens_servico.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
                <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  Nenhuma ordem de serviço registrada anteriormente
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Este veículo está registrado no sistema IDfeed. Conforme manutenções forem concluídas na oficina, elas serão listadas aqui de forma transparente e imutável.
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
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 p-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          {getServiceIcon(os.tipo_servico)}
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-bold text-slate-900">
                            {labelServico}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formatData(os.criado_em)}
                            </div>
                            <div className="flex items-center gap-1 font-medium text-slate-700">
                              <Gauge className="w-3.5 h-3.5 text-slate-400" />
                              Odômetro no serviço: {formatKm(os.km_no_servico)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Concluído & Aprovado
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Certificação / Rodapé de Veracidade */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-xs">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <p>Autenticidade garantida pela rede de oficinas credenciadas IDfeed</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="no-print text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Fazer outra consulta →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
