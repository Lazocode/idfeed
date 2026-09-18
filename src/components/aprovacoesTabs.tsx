/**
 * @file aprovacoesTabs.tsx
 * @description Painel com abas e cartões de métricas para triagem de credenciamento de oficinas.
 * Permite alternar a visualização entre oficinas pendentes de análise, homologadas e reprovadas.
 * @module components/aprovacoesTabs
 * @recommendedPath src/components/aprovacoesTabs.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";

/**
 * Estrutura de dados representativa de uma oficina para fins de triagem administrativa.
 */
export interface OficinaResumo {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  status: string;
  criado_em: string;
}

/**
 * Propriedades do componente `AprovacoesTabs`.
 */
interface AprovacoesTabsProps {
  /** Oficinas aguardando parecer e conferência documental. */
  pendentes: OficinaResumo[];
  /** Oficinas credenciadas e homologadas ativas. */
  aprovadas: OficinaResumo[];
  /** Oficinas com credenciamento recusado. */
  rejeitadas: OficinaResumo[];
}

/**
 * Componente cliente com abas interativas e lista de oficinas segmentadas por status.
 *
 * @param props - Listas de oficinas agrupadas por status de aprovação.
 * @returns Painel de triagem com contadores rápidos e navegação detalhada.
 */
export default function AprovacoesTabs({
  pendentes,
  aprovadas,
  rejeitadas,
}: AprovacoesTabsProps) {
  const [aba, setAba] = useState<"pendentes" | "aprovadas" | "rejeitadas">("pendentes");

  // Filtra as oficinas com base na aba ativa selecionada
  const oficinas =
    aba === "pendentes"
      ? pendentes
      : aba === "aprovadas"
        ? aprovadas
        : rejeitadas;

  return (
    <div className="space-y-6">
      {/* CARDS DE RESUMO / ABAS DE NAVEGAÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          id="tab-oficinas-pendentes"
          type="button"
          onClick={() => setAba("pendentes")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            aba === "pendentes"
              ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pendentes
            </span>
            <span className="text-xs text-slate-400">Aguardando</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {pendentes.length}
          </div>
        </button>

        <button
          id="tab-oficinas-aprovadas"
          type="button"
          onClick={() => setAba("aprovadas")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            aba === "aprovadas"
              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aprovadas
            </span>
            <span className="text-xs text-slate-400">Credenciadas</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {aprovadas.length}
          </div>
        </button>

        <button
          id="tab-oficinas-rejeitadas"
          type="button"
          onClick={() => setAba("rejeitadas")}
          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
            aba === "rejeitadas"
              ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
              : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Rejeitadas
            </span>
            <span className="text-xs text-slate-400">Reprovadas</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">
            {rejeitadas.length}
          </div>
        </button>
      </div>

      {/* LISTAGEM DE OFICINAS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            {aba === "pendentes" && "Oficinas Aguardando Parecer"}
            {aba === "aprovadas" && "Oficinas Homologadas"}
            {aba === "rejeitadas" && "Cadastros Recusados"}
          </h2>
          <span className="text-xs text-slate-400">
            {oficinas.length} {oficinas.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {oficinas.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-slate-400">
            Nenhuma oficina nesta categoria no momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {oficinas.map((oficina) => (
              <div
                key={oficina.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        oficina.status === "pendente"
                          ? "bg-amber-500"
                          : oficina.status === "aprovada"
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                      }`}
                    />
                    <span className="font-semibold text-sm text-slate-900">
                      {oficina.nome}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pl-4">
                    <span>CNPJ: <strong className="text-slate-700 font-mono">{oficina.cnpj || "Não informado"}</strong></span>
                    <span>Telefone: <strong className="text-slate-700">{oficina.telefone || "Não informado"}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <Link
                    id={`link-analisar-oficina-${oficina.id}`}
                    href={`/admin/aprovacoes/${oficina.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs"
                  >
                    <span>{aba === "pendentes" ? "Analisar Documentos" : "Ver Detalhes"}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

