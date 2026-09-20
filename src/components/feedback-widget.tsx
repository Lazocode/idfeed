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
      <aside
        aria-label="Canal de suporte e opinião"
        className="no-print fixed bottom-6 right-6 z-50 pointer-events-auto"
        style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999 }}
      >
        <button
          id="btn-abrir-widget-feedback"
          type="button"
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all border border-slate-700 cursor-pointer text-xs font-medium"
          title="Deixe uma sugestão ou relate uma dúvida"
        >
          <MessageSquarePlus className="w-4 h-4 text-slate-300" />
          <span>Opinião / Suporte</span>
        </button>
      </aside>

      {/* Modal de envio */}
      <FeedbackModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </>
  );
}
