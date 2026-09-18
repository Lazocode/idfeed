/**
 * @file aprovacaoOficina.tsx
 * @description Componente interativo de moderação administrativa para homologação ou recusa de oficinas.
 * Permite que o administrador aprove o credenciamento imediatamente ou informe o motivo detalhado de rejeição.
 * @module components/aprovacaoOficina
 * @recommendedPath src/components/aprovacaoOficina.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, AlertCircle, Loader2 } from "lucide-react";

// 2. Ações de servidor (Server Actions)
import { aprovarOficina, rejeitarOficina } from "@/actions/aprovacao";

/**
 * Propriedades para o componente `AprovacaoOficina`.
 */
interface AprovacaoOficinaProps {
  /** Identificador único da oficina no banco de dados (UUID). */
  lojaId: string;
}

/**
 * Componente cliente com ações de moderação cadastral de oficinas credenciadas.
 *
 * @param props - Propriedades contendo o ID da loja a ser auditada.
 * @returns Painel de botões de aprovação e modal/área de recusa com justificativa.
 */
export default function AprovacaoOficina({ lojaId }: AprovacaoOficinaProps) {
  const router = useRouter();

  // Estados locais do fluxo de moderação
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modoRejeicao, setModoRejeicao] = useState(false);
  const [observacao, setObservacao] = useState("");

  /**
   * Executa a aprovação do credenciamento da oficina.
   */
  async function handleAprovar() {
    setErro("");
    setLoading(true);

    try {
      await aprovarOficina(lojaId);
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível aprovar a oficina."
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * Executa a rejeição do credenciamento da oficina mediante justificativa obrigatória.
   */
  async function handleRejeitar() {
    setErro("");

    if (!observacao.trim()) {
      setErro("Informe o motivo da rejeição.");
      return;
    }

    setLoading(true);

    try {
      await rejeitarOficina(lojaId, observacao);
      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível rejeitar a oficina."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-2">
      {!modoRejeicao ? (
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            id={`btn-aprovar-oficina-${lojaId}`}
            type="button"
            onClick={handleAprovar}
            disabled={loading}
            className="w-full flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-all shadow-xs cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Aprovar Credenciamento</span>
          </button>

          <button
            id={`btn-iniciar-rejeicao-${lojaId}`}
            type="button"
            onClick={() => {
              setErro("");
              setModoRejeicao(true);
            }}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Rejeitar</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label
              htmlFor={`observacao-${lojaId}`}
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Motivo da Rejeição *
            </label>

            <textarea
              id={`observacao-${lojaId}`}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Descreva o problema com a documentação para notificar o responsável..."
              maxLength={500}
              rows={3}
              disabled={loading}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 shadow-2xs transition-all resize-y"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              id={`btn-confirmar-rejeicao-${lojaId}`}
              type="button"
              onClick={handleRejeitar}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-60 transition-all shadow-xs cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span>Confirmar Rejeição</span>
            </button>

            <button
              id={`btn-cancelar-rejeicao-${lojaId}`}
              type="button"
              onClick={() => {
                setErro("");
                setObservacao("");
                setModoRejeicao(false);
              }}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{erro}</span>
        </div>
      )}
    </div>
  );
}

