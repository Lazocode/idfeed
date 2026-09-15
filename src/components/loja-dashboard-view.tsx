"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/logout-button";
import { formatPlaca } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Boxes,
  ClipboardList,
  Search,
  Plus,
  Bell,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  X,
  Menu,
} from "lucide-react";

interface LojaDashboardViewProps {
  loja: {
    id: string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
  } | null;
  user: {
    nome?: string | null;
    email?: string | null;
    role?: string | null;
  };
  veiculos: Array<{
    id: string;
    placa: string;
    modelo: string;
    ano?: number | null;
    km_atual: number;
    km_proxima_revisao?: number | null;
    proprietario_nome?: string | null;
    criado_em?: string;
  }>;
  materiais: Array<{
    id: string;
    nome: string;
    sku: string;
    quantidade_atual: number;
    quantidade_minima: number;
    criado_em?: string;
  }>;
  query: string;
}

export default function LojaDashboardView({
  loja,
  user,
  veiculos,
  materiais,
  query,
}: LojaDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"veiculos" | "materiais">("veiculos");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDate] = useState(new Date());

  const totalVeiculos = veiculos.length;
  const revisaoProxima = veiculos.filter(
    (v) => v.km_proxima_revisao && v.km_proxima_revisao - v.km_atual <= 3000
  ).length;
  const emDia = veiculos.filter(
    (v) => !v.km_proxima_revisao || v.km_proxima_revisao - v.km_atual > 3000
  ).length;
  const estoqueBaixo = materiais.filter(
    (m) => m.quantidade_atual < m.quantidade_minima
  ).length;

  const percentEmDia = totalVeiculos > 0 ? Math.round((emDia / totalVeiculos) * 100) : 100;

  // Calendário do mês atual
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  // Dias do mês
  const firstDayIndex = new Date(currentYear, currentDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Nome do usuário formatado
  const userName = user?.nome || loja?.nome || "Responsável Técnico";

  return (
    <div className="min-h-screen bg-[#eef1f5] text-slate-900 p-2 sm:p-4 lg:p-6 font-sans">
      {/* Moldura Principal com cantos arredondados generosos */}
      <div className="max-w-[1540px] mx-auto bg-white rounded-3xl lg:rounded-[32px] shadow-sm border border-slate-200/80 overflow-hidden flex flex-col min-h-[92vh]">
        
        <div className="flex flex-1 flex-col lg:flex-row">
          {/* ════════════ SIDEBAR ESQUERDA ════════════ */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-100 p-6 flex flex-col justify-between transition-transform lg:static lg:translate-x-0
              ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:shadow-none"}
            `}
          >
            <div className="space-y-7">
              {/* Topo da Sidebar: Logo & Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Image
                    src="/IDfeed-logo.jpg"
                    alt="IDfeed"
                    width={130}
                    height={36}
                    priority
                    referrerPolicy="no-referrer"
                    className="h-7 w-auto object-contain"
                  />
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ativo
                </div>
              </div>

              {/* Saudação com visual limpo */}
              <div className="pt-2">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Visão Geral
                </p>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug mt-0.5">
                  Olá, <br className="hidden sm:inline" />
                  <span className="text-slate-800 font-extrabold">{userName}</span>
                </h1>
              </div>

              {/* Menu Principal */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
                  Menu Principal
                </p>

                <button
                  onClick={() => setActiveTab("veiculos")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    activeTab === "veiculos"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Painel de Veículos</span>
                </button>

                <button
                  onClick={() => setActiveTab("materiais")}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    activeTab === "materiais"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Boxes className="w-4 h-4" />
                  <span>Estoque & Peças</span>
                </button>

                <Link
                  href="/loja/novo"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Novo</span>
                </Link>
              </div>

              {/* Menu Secundário */}
              <div className="space-y-1 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-1">
                  Oficina & Ajuda
                </p>

                <Link
                  href="/loja/enviar-documento"
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Documentos da Oficina</span>
                </Link>

                <Link
                  href="/consulta"
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>Consultar Placa</span>
                </Link>
              </div>
            </div>

            {/* Card de Destaque no Rodapé da Sidebar (Estilo Dribbble) */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold tracking-wide uppercase text-slate-300">
                    IDfeed Certificado
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3 leading-snug">
                  {loja?.nome || "Oficina Credenciada"}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">
                  <span>Prontuário Ativo</span>
                  <span className="text-emerald-400 font-semibold">100% OK</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Overlay mobile para fechar sidebar */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/20 z-30 lg:hidden backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ════════════ CONTEÚDO PRINCIPAL (DIREITA) ════════════ */}
          <main className="flex-1 p-4 sm:p-6 lg:p-7 flex flex-col space-y-6 overflow-hidden">
            {/* ─── Topbar: Busca, Ação Pill e Perfil ─── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-1">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                  aria-label="Abrir menu lateral"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Barra de busca oval / pill */}
                <form method="get" className="relative flex-1 sm:w-80 md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Buscar placa, modelo, cliente ou SKU..."
                    className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-full pl-9 pr-14 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                  />
                  {query && (
                    <Link
                      href="/loja/dashboard"
                      className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-colors"
                  >
                    Ir
                  </button>
                </form>
              </div>

              {/* Botões do Topo Direito */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Link
                  href="/loja/novo"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Registro</span>
                </Link>

                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/70 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
                  <Bell className="w-3.5 h-3.5" />
                </div>

                <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                {/* Perfil do Usuário */}
                <div className="flex items-center gap-2.5 pl-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px]">
                      {userName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                      {user?.email || loja?.email || "Oficina Conectada"}
                    </p>
                  </div>
                  <LogoutButton
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Sair
                  </LogoutButton>
                </div>
              </div>
            </div>

            {/* ─── Linha de 4 KPI Cards Estilo Bento ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {/* Card 1: Em Destaque Escuro (Igual ao card verde-escuro do design) */}
              <div className="bg-slate-900 text-white rounded-2xl p-4.5 flex flex-col justify-between relative overflow-hidden shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-300">
                    Total de Veículos
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Car className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  {/* Gráfico de onda SVG sutil */}
                  <div className="w-24 h-8 text-emerald-400/80">
                    <svg viewBox="0 0 100 35" fill="none" className="w-full h-full">
                      <path
                        d="M0 28 Q 20 10, 40 22 T 80 8 T 100 18"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold tracking-tight text-white block">
                      {totalVeiculos}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Cadastrados
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Veículos em Dia */}
              <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">
                    Revisões em Dia
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold tracking-tight text-slate-900 block">
                      {emDia}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Status regular
                    </span>
                  </div>
                  <div className="flex items-end gap-1 h-6 pb-1">
                    <div className="w-1.5 h-3 bg-blue-200 rounded-xs" />
                    <div className="w-1.5 h-4 bg-blue-300 rounded-xs" />
                    <div className="w-1.5 h-5 bg-blue-500 rounded-xs" />
                    <div className="w-1.5 h-6 bg-blue-600 rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Card 3: Revisões Próximas */}
              <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">
                    Revisões Próximas
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold tracking-tight text-slate-900 block">
                      {revisaoProxima}
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Até 3.000 km
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white">
                    Atenção
                  </span>
                </div>
              </div>

              {/* Card 4: Estoque & Reposição */}
              <div className="bg-slate-50/80 rounded-2xl p-4.5 border border-slate-200/70 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-500">
                    Estoque & Peças
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-200/60 text-slate-700 flex items-center justify-center">
                    <Boxes className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold tracking-tight text-slate-900 block">
                      {materiais.length}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {estoqueBaixo > 0 ? `${estoqueBaixo} abaixo do mín.` : "Estoque normal"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${estoqueBaixo > 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
                    <span className="text-[10px] font-semibold text-slate-500">
                      {estoqueBaixo > 0 ? "Repor" : "OK"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Grid Bento Inferior (Duas Colunas: Analítico/Tabela + Calendário/Atendimentos) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
              
              {/* COLUNA ESQUERDA/CENTRAL (8 colunas): Resumo da Frota e Tabela de Registros */}
              <div className="lg:col-span-8 space-y-5">
                {/* Bloco Analítico de Frota */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-slate-600" />
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Visão Analítica da Oficina
                      </h2>
                    </div>

                    {/* Tabs de alternância rápida */}
                    <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs self-start">
                      <button
                        onClick={() => setActiveTab("veiculos")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeTab === "veiculos"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Veículos ({totalVeiculos})
                      </button>
                      <button
                        onClick={() => setActiveTab("materiais")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeTab === "materiais"
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Estoque ({materiais.length})
                      </button>
                    </div>
                  </div>

                  {/* Barra de progresso proporcional estilo Dribbble */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200/60 mb-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-800">
                        {percentEmDia}% da frota em conformidade
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {emDia} em dia • {revisaoProxima} a revisar
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentEmDia}%` }}
                      />
                      <div
                        className="bg-amber-400 h-full transition-all duration-500"
                        style={{ width: `${100 - percentEmDia}%` }}
                      />
                    </div>
                  </div>

                  {/* TABELA LIMPA: Veículos ou Materiais */}
                  {activeTab === "veiculos" ? (
                    <div>
                      {veiculos.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">
                          Nenhum veículo encontrado para esta consulta.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {veiculos.map((v) => {
                            const kmToGo = v.km_proxima_revisao
                              ? v.km_proxima_revisao - v.km_atual
                              : null;
                            const soon = kmToGo !== null && kmToGo <= 3000;

                            return (
                              <Link
                                key={v.id}
                                href={`/loja/veiculo/${v.id}`}
                                className="group flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/70 hover:border-slate-300 hover:shadow-2xs transition-all text-left"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                    <Car className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                        {formatPlaca(v.placa)}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-800 truncate">
                                        {v.modelo}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                      {v.proprietario_nome ? `Proprietário: ${v.proprietario_nome}` : "Sem proprietário"} • {v.km_atual.toLocaleString("pt-BR")} km
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  {soon ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      {Math.max(0, kmToGo).toLocaleString("pt-BR")} km
                                    </span>
                                  ) : kmToGo !== null ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Em dia
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">
                                      Sem revisão
                                    </span>
                                  )}
                                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {materiais.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">
                          Nenhum material cadastrado no estoque.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {materiais.map((m) => {
                            const baixo = m.quantidade_atual < m.quantidade_minima;
                            return (
                              <Link
                                key={m.id}
                                href={`/loja/material/${m.id}`}
                                className="group flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200/70 hover:border-slate-300 hover:shadow-2xs transition-all text-left"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                    baixo ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-700"
                                  }`}>
                                    <Boxes className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                      {m.nome}
                                    </p>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                      SKU: {m.sku} • Cota Mínima: {m.quantidade_minima} un.
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  {baixo ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      {m.quantidade_atual} un.
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                      {m.quantidade_atual} un.
                                    </span>
                                  )}
                                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA DIREITA (4 colunas): Calendário do Mês e Atendimentos Recentes */}
              <div className="lg:col-span-4 space-y-5">
                {/* WIDGET DE CALENDÁRIO (Cópia fiel do layout da imagem) */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                      {currentMonthName} {currentYear}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-200/80 flex items-center justify-center hover:text-slate-900 cursor-pointer">
                        <ChevronLeft className="w-3 h-3" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-200/80 flex items-center justify-center hover:text-slate-900 cursor-pointer">
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>

                  {/* Dias da Semana */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                  </div>

                  {/* Dias do Mês */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {calendarDays.map((day, idx) => {
                      if (!day) {
                        return <div key={`empty-${idx}`} className="h-7" />;
                      }
                      const isToday = day === currentDay;
                      const hasEvent = day === 8 || day === 15 || day === 22;

                      return (
                        <div
                          key={`day-${day}`}
                          className={`h-7 flex items-center justify-center rounded-full text-[11px] font-medium transition-all ${
                            isToday
                              ? "bg-slate-900 text-white font-bold shadow-2xs"
                              : hasEvent
                              ? "bg-emerald-100 text-emerald-800 font-bold"
                              : "text-slate-600 hover:bg-slate-200/60"
                          }`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PRÓXIMOS ATENDIMENTOS / REVISÕES (Estilo Dribbble) */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Próximas Revisões
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {veiculos.slice(0, 3).length} veículos
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {veiculos.slice(0, 3).map((v, i) => (
                      <Link
                        key={`agenda-${v.id}`}
                        href={`/loja/veiculo/${v.id}`}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/60 hover:border-slate-300 transition-all text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {(v.proprietario_nome || v.modelo).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {v.proprietario_nome || "Cliente Oficina"}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {v.modelo} • {formatPlaca(v.placa)}
                            </p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 shrink-0">
                          {i === 0 ? "Amanhã" : `Em ${i + 2} dias`}
                        </span>
                      </Link>
                    ))}

                    {veiculos.length === 0 && (
                      <p className="text-[11px] text-slate-400 py-3 text-center">
                        Sem revisões agendadas.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
