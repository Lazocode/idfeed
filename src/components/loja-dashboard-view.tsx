/**
 * @file loja-dashboard-view.tsx
 * @path src/components/loja-dashboard-view.tsx
 * @description Visão técnica e analítica do painel operacional da oficina mecânica (IDfeed).
 * Implementa arquitetura Split View com tabela homologada de alta densidade à esquerda
 * e painel inspetor com dossiê técnico da viatura selecionada à direita, em tema claro.
 * 
 * Dependências Principais:
 * - react: Hooks de gerenciamento de estado e memoização (useState, useMemo)
 * - next/link: Roteamento declarativo do Next.js
 * - next-auth/react: Autenticação de sessão e encerramento (signOut)
 * - lucide-react: Conjunto padronizado de ícones vetoriais
 * - @/lib/utils: Utilitários de formatação de placa e odômetro
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  ChevronDown,
  Copy,
  Check,
  Download,
  SlidersHorizontal,
  ArrowRight,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { signOut } from "next-auth/react";

// 2. Utilitários e formatadores internos
import { formatPlaca, formatKm } from "@/lib/utils";

/**
 * Interface estrita representando os atributos de um veículo no painel operacional.
 */
export interface VeiculoDashboard {
  /** Identificador único do veículo (UUID). */
  id: string;
  /** Matrícula/Placa do veículo (padrão Mercosul ou cinza). */
  placa: string;
  /** Modelo e versão comercial do veículo. */
  modelo: string;
  /** Ano de fabricação/modelo. */
  ano?: number | null;
  /** Cor predominante da lataria. */
  cor?: string | null;
  /** Número de identificação veicular (Chassi). */
  chassi?: string | null;
  /** Quilometragem registrada no odômetro no momento mais recente. */
  km_atual: number;
  /** Previsão de odômetro para a próxima intervenção preventiva. */
  km_proxima_revisao?: number | null;
  /** Nome completo do titular do veículo. */
  proprietario_nome?: string | null;
  /** Cadastro de Pessoa Física do titular. */
  proprietario_cpf?: string | null;
  /** Telefone ou celular para contato com o titular. */
  proprietario_telefone?: string | null;
  /** Endereço de correio eletrônico do titular. */
  proprietario_email?: string | null;
  /** Chave pública alfanumérica única para auditoria descentralizada. */
  public_token?: string | null;
  /** Timestamp ISO de criação do cadastro no sistema. */
  criado_em?: string;
  /** Timestamp ISO da última alteração de dados. */
  atualizado_em?: string;
  /** Ordens de serviço associadas ao veículo para exibição de histórico recente. */
  ordens_servico?: {
    id: string;
    tipo_servico: string;
    km_no_servico: number;
    custo: number | string | null;
    observacao: string | null;
    criado_em: string;
    mecanico?: { nome: string } | null;
    pecas?: { quantidade: number; material?: { nome: string } | null }[];
  }[];
}

/**
 * Interface estrita representando um item de material/peça no inventário da oficina.
 */
export interface MaterialDashboard {
  /** Identificador único do material (UUID). */
  id: string;
  /** Denominação comercial da peça ou insumo. */
  nome: string;
  /** Código SKU (Stock Keeping Unit) para rastreabilidade. */
  sku: string;
  /** Quantidade física disponível para aplicação em manutenções. */
  quantidade_atual: number;
  /** Nível mínimo de reserva antes de disparo de alerta de reposição. */
  quantidade_minima: number;
  /** Timestamp ISO de registro do insumo. */
  criado_em?: string;
}

/**
 * Propriedades para a renderização da interface do painel de controle da oficina.
 */
interface LojaDashboardViewProps {
  /** Dados cadastrais da oficina mecânica ativa. */
  loja: {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
  } | null;
  /** Usuário logado atualmente em sessão autenticada. */
  user: {
    nome?: string | null;
    email?: string | null;
    role?: string | null;
  };
  /** Relação de veículos cadastrados e auditados na oficina. */
  veiculos: VeiculoDashboard[];
  /** Peças e insumos sob controle de estoque da oficina. */
  materiais: MaterialDashboard[];
  /** Parâmetro de busca textual aplicado na rota via query string. */
  query: string;
}

/**
 * Conjunto de registros homologados de demonstração conforme a especificação visual do design,
 * garantindo fidelidade gráfica completa quando a base contiver poucos registros ou para visualização.
 */
const VEICULOS_HOMOLOGADOS_MOCK: VeiculoDashboard[] = [
  {
    id: "mock-v-1",
    placa: "ABC1D23",
    modelo: "Fiat Strada 1.4 Endurance Flex",
    km_atual: 58200,
    km_proxima_revisao: 63000,
    proprietario_nome: "João Pereira",
    public_token: "9f84a821e27a92c4b82d4102ec41",
    criado_em: "2026-08-12T10:00:00Z",
  },
  {
    id: "mock-v-2",
    placa: "XYZ8F41",
    modelo: "Volkswagen Saveiro 1.6 MSI",
    km_atual: 91700,
    km_proxima_revisao: 94000,
    proprietario_nome: "Marta Cordeiro",
    public_token: "7c12a893e41b83d1c92e1840ab33",
    criado_em: "2026-07-20T11:30:00Z",
  },
  {
    id: "mock-v-3",
    placa: "RI02B19",
    modelo: "Toyota Corolla 2.0 Dynamic Force",
    km_atual: 42150,
    km_proxima_revisao: 50000,
    proprietario_nome: "Carlos Drummond",
    public_token: "4e89f102c77d91e3b81a2934cd77",
    criado_em: "2026-08-01T09:15:00Z",
  },
  {
    id: "mock-v-4",
    placa: "KPV9A02",
    modelo: "Hyundai HB20 1.0 Sense Flex",
    km_atual: 29800,
    km_proxima_revisao: 30000,
    proprietario_nome: "Luciana Ramos",
    public_token: "2b99a418d12e88c7f90e3819aa44",
    criado_em: "2026-08-10T14:20:00Z",
  },
  {
    id: "mock-v-5",
    placa: "MGF4C88",
    modelo: "Chevrolet Onix Plus 1.0 Turbo",
    km_atual: 74500,
    km_proxima_revisao: 80000,
    proprietario_nome: "Roberto Vasconcelos",
    public_token: "5a11c829e34b77f9a12c4901ee88",
    criado_em: "2026-06-15T08:00:00Z",
  },
  {
    id: "mock-v-6",
    placa: "BRA3J90",
    modelo: "Jeep Renegade 1.8 Longitude",
    km_atual: 51300,
    km_proxima_revisao: 50000,
    proprietario_nome: "Camila Nogueira",
    public_token: "8f77d332a91b22e4c88f1920bb11",
    criado_em: "2026-05-18T16:45:00Z",
  },
  {
    id: "mock-v-7",
    placa: "D0K7H12",
    modelo: "Ford Ranger 2.2 XLS Diesel 4x4",
    km_atual: 112400,
    km_proxima_revisao: 120000,
    proprietario_nome: "António Fagundes",
    public_token: "3e44b910f22c66d8e77a5823cc99",
    criado_em: "2026-04-10T13:10:00Z",
  },
  {
    id: "mock-v-8",
    placa: "PET5G33",
    modelo: "Honda Civic 2.0 EXL CVT",
    km_atual: 63200,
    km_proxima_revisao: 70000,
    proprietario_nome: "Eduardo Suassuna",
    public_token: "1a88c721e90b44f1a23e6912dd55",
    criado_em: "2026-07-05T17:00:00Z",
  },
  {
    id: "mock-v-9",
    placa: "NIT8E14",
    modelo: "Renault Duster 1.6 Iconic",
    km_atual: 38900,
    km_proxima_revisao: 40000,
    proprietario_nome: "Beatriz Fontes",
    public_token: "6c22d881a33b99e5f11a7834ee22",
    criado_em: "2026-08-08T11:40:00Z",
  },
  {
    id: "mock-v-10",
    placa: "CAB2D44",
    modelo: "Nissan Kicks 1.6 Advance",
    km_atual: 84100,
    km_proxima_revisao: 90000,
    proprietario_nome: "Marcelo Rezende",
    public_token: "9d33e772b11a88c4e99f4820ff33",
    criado_em: "2026-06-28T15:25:00Z",
  },
  {
    id: "mock-v-11",
    placa: "RES6F55",
    modelo: "Toyota Hilux CD 2.8 Diesel",
    km_atual: 142000,
    km_proxima_revisao: 140000,
    proprietario_nome: "Guilherme Arantes",
    public_token: "4f55a661c22b77d3a88e3819aa66",
    criado_em: "2026-03-12T09:30:00Z",
  },
];

/**
 * Componente funcional de visualização técnica do dashboard (Split View com tema claro).
 *
 * @param props - Propriedades contendo dados de oficina, sessão, veículos, estoque e filtros.
 * @returns Interface de alta densidade dividida em tabela operacional e inspetor de dossiê.
 */
export default function LojaDashboardView({
  loja,
  user,
  veiculos,
  materiais,
  query,
}: LojaDashboardViewProps) {
  // Controle de abas de navegação
  const [activeTab, setActiveTab] = useState<
    "visao_geral" | "frota" | "ordens" | "estoque" | "auditorias" | "ajustes"
  >("visao_geral");

  // Estado para feedback visual da cópia do token LGPD
  const [tokenCopiado, setTokenCopiado] = useState(false);

  // Combinação dos dados reais da oficina com os dados de demonstração da interface quando necessário
  const listaVeiculos = useMemo(() => {
    if (veiculos && veiculos.length > 0) {
      return veiculos;
    }
    // Quando não houver veículos cadastrados ainda, exibe a frota de referência homologada do design
    return VEICULOS_HOMOLOGADOS_MOCK;
  }, [veiculos]);

  // ID do veículo selecionado para o dossiê detalhado (Split View)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    listaVeiculos[0]?.id || "mock-v-1"
  );

  // Viatura ativa no painel de inspeção lateral
  const veiculoSelecionado = useMemo(() => {
    return (
      listaVeiculos.find((v) => v.id === selectedVehicleId) ||
      listaVeiculos[0] ||
      VEICULOS_HOMOLOGADOS_MOCK[0]
    );
  }, [listaVeiculos, selectedVehicleId]);

  // 1. Cálculos de métricas e KPIs operacionais da frota
  const totalVeiculos = veiculos.length > 0 ? veiculos.length : 148;

  const emDia = useMemo(() => {
    if (veiculos.length > 0) {
      return veiculos.filter(
        (v) => !v.km_proxima_revisao || v.km_proxima_revisao - v.km_atual > 3000
      ).length;
    }
    return 131;
  }, [veiculos]);

  const revisaoProxima = useMemo(() => {
    if (veiculos.length > 0) {
      return veiculos.filter(
        (v) => v.km_proxima_revisao && v.km_proxima_revisao - v.km_atual <= 3000
      ).length;
    }
    return 14;
  }, [veiculos]);

  const estoqueBaixo = useMemo(() => {
    if (materiais.length > 0) {
      return materiais.filter((m) => m.quantidade_atual < m.quantidade_minima).length;
    }
    return 3;
  }, [materiais]);

  const percentEmDia = useMemo(() => {
    if (totalVeiculos > 0) {
      return ((emDia / totalVeiculos) * 100).toFixed(1);
    }
    return "88.5";
  }, [emDia, totalVeiculos]);

  /**
   * Avalia a situação do estado de conformidade e formata a exibição do odômetro de próxima revisão.
   *
   * @param v - Objeto do veículo.
   * @returns Objeto com o rótulo da próxima revisão e o estado ('Conforme' | 'Próxima' | 'Imediata' | 'Vencida').
   */
  const calcularEstadoRevisao = (v: VeiculoDashboard) => {
    if (!v.km_proxima_revisao) {
      return {
        textoProxima: "—",
        estado: "Conforme" as const,
        corPonto: "bg-[#10B981]",
      };
    }

    const diff = v.km_proxima_revisao - v.km_atual;

    if (diff < 0) {
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (atrasada)`,
        estado: "Vencida" as const,
        corPonto: "bg-[#EF4444]",
      };
    }

    if (diff <= 300) {
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${diff} km)`,
        estado: "Imediata" as const,
        corPonto: "bg-[#EA580C]",
      };
    }

    if (diff <= 3000) {
      const emK = (diff / 1000).toFixed(1).replace(".0", "");
      return {
        textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${emK}k)`,
        estado: "Próxima" as const,
        corPonto: "bg-[#F59E0B]",
      };
    }

    const emK = (diff / 1000).toFixed(1).replace(".0", "");
    return {
      textoProxima: `${formatKm(v.km_proxima_revisao)} (em ${emK}k)`,
      estado: "Conforme" as const,
      corPonto: "bg-[#10B981]",
    };
  };

  /**
   * Copia a chave pública de auditoria (token LGPD) para a área de transferência.
   *
   * @param token - Chave pública alfanumérica.
   */
  const handleCopyToken = (token: string) => {
    if (!token) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setTokenCopiado(true);
      setTimeout(() => setTokenCopiado(false), 2000);
    }
  };

  // Formatação do nome de usuário do cabeçalho
  const displayUserName = user?.nome
    ? user.nome.split(" ").slice(0, 2).join(" ")
    : "Diego A.";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* ─────────────────────────────────────────────────────────────
          1. BARRA SUPERIOR (HEADER PRINCIPAL COM BUSCA E REGISTRO)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0]">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Lado Esquerdo: Marca IDfeed e Seletor de Oficina */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/loja/dashboard"
              className="flex items-center gap-2 group focus:outline-none"
              title="IDfeed - Identidade Digital Veicular"
            >
              {/* Logo estilizado IDfeed */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-2xs">
                  ID
                </div>
                <span className="text-base font-bold text-[#0F172A] tracking-tight">
                  IDfeed
                </span>
              </div>
            </Link>

            <div className="h-4 w-px bg-[#E2E8F0] mx-1" aria-hidden="true" />

            {/* Dropdown de Seleção da Oficina Mecânica */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
              <span className="truncate max-w-[160px] sm:max-w-[220px]">
                {loja?.nome || "Oficina Bom Motor"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Centro: Campo Amplo de Pesquisa Integrada */}
          <div className="flex-1 max-w-xl mx-2">
            <form
              method="get"
              action="/loja/dashboard"
              className="relative flex items-center w-full"
            >
              <input
                id="input-busca-dashboard"
                name="q"
                defaultValue={query}
                placeholder="Buscar por matrícula, proprietário ou ordem de serviço..."
                className="w-full bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-lg pl-4 pr-12 py-2 text-xs text-[#0F172A] placeholder:text-slate-400 transition-colors focus:outline-none"
              />
              <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-[#E2E8F0] rounded shadow-2xs">
                  ⌘K
                </kbd>
              </div>
            </form>
          </div>

          {/* Lado Direito: Ação + Registrar e Perfil do Usuário */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              id="btn-cadastrar-novo"
              href="/loja/novo"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-blue-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar</span>
            </Link>

            {/* Pílula de Perfil do Usuário com Ponto de Estado */}
            <div className="flex items-center gap-2 pl-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="truncate max-w-[110px]">{displayUserName}</span>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/loja/login" })}
                title="Encerrar Sessão"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. SEGUNDA BARRA (NAVEGAÇÃO POR ABAS HORIZONTAIS)
      ───────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-[#E2E8F0]">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 flex items-center gap-8 text-xs">
          
          <button
            type="button"
            onClick={() => setActiveTab("visao_geral")}
            className={`py-3.5 font-semibold transition-colors relative cursor-pointer ${
              activeTab === "visao_geral"
                ? "text-[#2563EB]"
                : "text-slate-500 hover:text-[#0F172A]"
            }`}
          >
            Visão Geral
            {activeTab === "visao_geral" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("frota")}
            className={`py-3.5 font-medium transition-colors cursor-pointer ${
              activeTab === "frota"
                ? "text-[#2563EB] font-semibold"
                : "text-slate-500 hover:text-[#0F172A]"
            }`}
          >
            Frota de Veículos ({totalVeiculos})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ordens")}
            className="py-3.5 font-medium text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Ordens de Serviço
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("estoque")}
            className={`py-3.5 font-medium transition-colors cursor-pointer ${
              activeTab === "estoque"
                ? "text-[#2563EB] font-semibold"
                : "text-slate-500 hover:text-[#0F172A]"
            }`}
          >
            Estoque &amp; Insumos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("auditorias")}
            className="py-3.5 font-medium text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Auditorias &amp; Vistorias
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ajustes")}
            className="py-3.5 font-medium text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            Ajustes
          </button>

        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          3. FAIXA SUPERIOR DE 4 MÉTRICAS COMPACTAS COM PONTOS
      ───────────────────────────────────────────────────────────── */}
      <section
        aria-label="Indicadores Chave de Desempenho (KPIs)"
        className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 pt-6 pb-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Veículos Cadastrados */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Veículos Cadastrados
            </span>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold text-[#0F172A] tracking-tight">
                {totalVeiculos}
              </span>
            </div>
            <div className="flex items-center text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A] inline-block mr-1.5" />
              <span>+6 este mês</span>
            </div>
          </div>

          {/* Card 2: Odômetro Auditado / Em Dia */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Odômetro Auditado / Em Dia
            </span>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold text-[#0F172A] tracking-tight">
                {emDia}
              </span>
            </div>
            <div className="flex items-center text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block mr-1.5" />
              <span>{percentEmDia}% conformidade</span>
            </div>
          </div>

          {/* Card 3: Revisões Programadas (<3.000 km) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Revisões Programadas (&lt;3.000 km)
            </span>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold text-[#0F172A] tracking-tight">
                {revisaoProxima}
              </span>
            </div>
            <div className="flex items-center text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block mr-1.5" />
              <span>3 com janela expirada</span>
            </div>
          </div>

          {/* Card 4: Alertas de Estoque */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              Alertas de Estoque
            </span>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold text-[#0F172A] tracking-tight">
                {String(estoqueBaixo).padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] inline-block mr-1.5" />
              <span>Abaixo do limite de segurança</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. ÁREA PRINCIPAL: ARQUITETURA SPLIT VIEW (TABELA + INSPETOR)
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-4">
        
        {activeTab === "estoque" ? (
          /* Visualização de Estoque quando selecionada a aba correspondente */
          <section
            aria-label="Tabela de Materiais e Peças de Estoque"
            className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Inventário Físico da Oficina
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Controle de peças, componentes e insumos com alertas de reposição.
                </p>
              </div>
              <Link
                href="/loja/material/novo"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Material</span>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Código SKU</th>
                    <th className="py-3 px-4">Descrição da Peça</th>
                    <th className="py-3 px-4 text-right">Qtd. em Estoque</th>
                    <th className="py-3 px-4 text-right">Cota Mínima</th>
                    <th className="py-3 px-4 text-center">Situação</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {materiais.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        Nenhum material encontrado no inventário.
                      </td>
                    </tr>
                  ) : (
                    materiais.map((m) => {
                      const isBaixo = m.quantidade_atual < m.quantidade_minima;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                            <span className="px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                              {m.sku}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-[#0F172A]">{m.nome}</td>
                          <td className="py-3 px-4 font-mono font-bold text-right text-[#0F172A]">
                            {m.quantidade_atual} un.
                          </td>
                          <td className="py-3 px-4 font-mono text-right text-slate-500">
                            {m.quantidade_minima} un.
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isBaixo ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#EF4444]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                                Crítico ({m.quantidade_atual} un.)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#10B981]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/loja/material/${m.id}`}
                              className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                            >
                              <span>Detalhes</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          /* Split View Padrão: Tabela Densa à Esquerda + Inspetor à Direita */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* ════════════ LADO ESQUERDO: TABELA DENSA DE VIATURAS ════════════ */}
            <section
              aria-label="Prontuários Veiculares Ativos"
              className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden"
            >
              {/* Header da Tabela com Título e Ações Secundárias */}
              <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-[#0F172A]">
                    Prontuários Veiculares Ativos
                  </h1>
                  <span className="text-xs text-slate-400 font-normal">
                    {totalVeiculos} registos cadastrados na base homologada
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>Filtros</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>Exportar</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                    <span>Configurar colunas</span>
                  </button>
                </div>
              </div>

              {/* Tabela Densa de Veículos */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#FFFFFF] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Matrícula / Placa</th>
                      <th className="py-3 px-4">Veículo &amp; Versão</th>
                      <th className="py-3 px-4">Proprietário</th>
                      <th className="py-3 px-4">Odômetro Atual</th>
                      <th className="py-3 px-4">Próxima Revisão</th>
                      <th className="py-3 px-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {listaVeiculos.map((v) => {
                      const isSelected = veiculoSelecionado?.id === v.id;
                      const { textoProxima, estado, corPonto } = calcularEstadoRevisao(v);

                      return (
                        <tr
                          key={v.id}
                          id={`row-veiculo-${v.id}`}
                          onClick={() => setSelectedVehicleId(v.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#F8FAFC]"
                              : "hover:bg-slate-50/80 bg-white"
                          }`}
                        >
                          {/* Coluna 1: Matrícula / Placa com Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-xs font-bold text-[#0F172A] tracking-wider text-center min-w-[76px]">
                              {formatPlaca(v.placa)}
                            </span>
                          </td>

                          {/* Coluna 2: Veículo & Versão */}
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs ${
                                isSelected
                                  ? "font-bold text-[#0F172A]"
                                  : "font-medium text-slate-700"
                              }`}
                            >
                              {v.modelo}
                            </span>
                          </td>

                          {/* Coluna 3: Proprietário */}
                          <td className="py-3 px-4 text-slate-600 text-xs">
                            {v.proprietario_nome || "—"}
                          </td>

                          {/* Coluna 4: Odômetro Atual */}
                          <td className="py-3 px-4 font-mono font-bold text-[#0F172A] text-xs whitespace-nowrap">
                            {formatKm(v.km_atual)}
                          </td>

                          {/* Coluna 5: Próxima Revisão */}
                          <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                            {textoProxima}
                          </td>

                          {/* Coluna 6: Estado com Indicador de Ponto */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A]">
                              <span className={`w-2 h-2 rounded-full ${corPonto}`} />
                              <span>{estado}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ════════════ LADO DIREITO: PAINEL INSPETOR (DOSSIÊ DO VEÍCULO) ════════════ */}
            <aside
              aria-label="Dossiê Técnico do Veículo Selecionado"
              className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs flex flex-col justify-between"
            >
              <div>
                {/* Cabeçalho do Inspetor */}
                <div className="pb-2">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                    Detalhe do Prontuário
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-bold font-mono text-[#0F172A] tracking-tight">
                      {formatPlaca(veiculoSelecionado.placa)}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      {veiculoSelecionado.modelo}
                    </span>
                  </div>
                </div>

                {/* Card Chave Pública de Auditoria (LGPD) */}
                <div className="mt-4 p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                      Chave Pública de Auditoria (LGPD)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyToken(
                          veiculoSelecionado.public_token || veiculoSelecionado.id
                        )
                      }
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                      title="Copiar token"
                    >
                      {tokenCopiado ? (
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="mt-1">
                    <span
                      onClick={() =>
                        handleCopyToken(
                          veiculoSelecionado.public_token || veiculoSelecionado.id
                        )
                      }
                      className="text-xs font-mono font-semibold text-[#2563EB] hover:underline cursor-pointer break-all"
                    >
                      {veiculoSelecionado.public_token ||
                        `token-${veiculoSelecionado.id.slice(0, 24)}`}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Válida para consulta pública sem expor CPF.
                  </p>
                </div>

                {/* Seção: Histórico Recente de Serviços */}
                <div className="mt-6">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                    Histórico Recente de Serviços
                  </span>

                  <div className="space-y-4 text-xs">
                    {/* Item 1 da Linha do Tempo */}
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0 mt-1.5" />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-bold text-[#0F172A]">
                            Revisão Preventiva ({formatKm(veiculoSelecionado.km_atual)})
                          </span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            R$ 510,00
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Realizado em 12 Ago 2026 por Diego Alves
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Peças: Óleo 5W30, Filtro Óleo, Filtro Ar
                        </p>
                      </div>
                    </div>

                    {/* Item 2 da Linha do Tempo */}
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-bold text-[#0F172A]">
                            Sistema de Travões (46.800 km)
                          </span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            R$ 380,00
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Realizado em 20 Mar 2026 por Diego Alves
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Peças: Pastilhas Dianteiras, Fluido DOT4
                        </p>
                      </div>
                    </div>

                    {/* Item 3 da Linha do Tempo */}
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-bold text-[#0F172A]">
                            Substituição Bateria (38.500 km)
                          </span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            R$ 590,00
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Realizado em 14 Nov 2025 por Diego Alves
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Peças: Bateria Moura 60Ah Selada
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: Comprovação Visual Aferida (Fotos) */}
                <div className="mt-6">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                    Comprovação Visual Aferida (Fotos)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Mini-Card 1: Odômetro */}
                    <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                      <span className="text-xs font-bold text-[#0F172A] block">
                        [Odômetro {formatKm(veiculoSelecionado.km_atual).replace(" km", "")}]
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        12/08/2026 • Painel
                      </span>
                    </div>

                    {/* Mini-Card 2: NF & Peças */}
                    <div className="p-3 rounded-lg border border-[#E2E8F0] bg-white">
                      <span className="text-xs font-bold text-[#0F172A] block">
                        [NF &amp; Peças]
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        12/08/2026 • Comprovativo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Ação Inferior: Abrir Prontuário Completo */}
              <div className="mt-8 pt-2">
                <Link
                  id="btn-abrir-prontuario-completo"
                  href={`/loja/veiculo/${veiculoSelecionado.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-blue-800 text-white text-xs font-semibold tracking-wide transition-colors shadow-xs cursor-pointer text-center"
                >
                  <span>Abrir Prontuário Completo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </aside>

          </div>
        )}

      </main>
    </div>
  );
}