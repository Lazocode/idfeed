/**
 * @file feedback-widget.tsx
 * @description Botão flutuante global que permite a clientes e testadores acionarem
 * a área de feedback e envio de opiniões a partir de qualquer tela da aplicação.
 * @module components/feedback-widget
 * @recommendedPath src/components/feedback-widget.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

// 2. Componentes internos
import FeedbackModal from "@/components/feedback-modal";

/**
 * Widget flutuante de feedback disponível em toda a aplicação.
 *
 * @returns Botão flutuante no canto inferior direito e modal de feedback acoplado.
 */
export default function FeedbackWidget() {
  const [modalAberto, setModalAberto] = useState<boolean>(false);

  return (
    <>
      <div className="no-print fixed bottom-4 right-4 z-40">
        <button
          id="btn-abrir-widget-feedback"
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-colors border border-slate-700 cursor-pointer text-xs font-medium"
          title="Deixe uma sugestão ou relate uma dúvida"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 text-slate-300" />
          <span>Opinião / Suporte</span>
        </button>
      </div>

      {/* Modal de envio */}
      <FeedbackModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </>
  );
}
