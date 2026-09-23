/**
 * @file feedback-modal.tsx
 * @description Modal de diálogo para captura ágil de feedbacks e opiniões de clientes e testadores.
 * Fornece interface acessível com controle de foco e fechamento por tecla Escape.
 * @module components/feedback-modal
 * @recommendedPath src/components/feedback-modal.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useEffect } from "react";
import { X, MessageSquareHeart } from "lucide-react";

// 2. Componentes internos
import FeedbackForm from "@/components/feedback-form";

/**
 * Propriedades do componente FeedbackModal.
 */
export interface FeedbackModalProps {
  /** Se o modal está visível. */
  isOpen: boolean;
  /** Função para fechar o modal. */
  onClose: () => void;
  /** Rota ou contexto da tela onde foi acionado. */
  paginaOrigem?: string;
}

/**
 * Modal flutuante para envio de feedback rápido durante a fase de testes.
 *
 * @param props - Propriedades do modal.
 * @returns Modal em overlay com formulário de feedback.
 */
export default function FeedbackModal({
  isOpen,
  onClose,
  paginaOrigem,
}: FeedbackModalProps) {
  // Fechar com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevenir scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-feedback-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Backdrop com clique para fechar */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Caixa do Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
            <div>
              <h2 id="titulo-feedback-modal" className="text-sm font-bold text-slate-900 tracking-tight">
                Espaço de Opinião &amp; Feedback
              </h2>
              <p className="text-[11px] text-slate-500">
                Ajude-nos a aprimorar o IDfleet durante estes testes
              </p>
            </div>
          </div>

          <button
            id="btn-fechar-modal-feedback"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com scroll suave */}
        <div className="p-5 overflow-y-auto">
          <FeedbackForm
            compacto
            paginaOrigemPadrao={paginaOrigem}
            aoConcluir={onClose}
          />
        </div>
      </div>
    </div>
  );
}
