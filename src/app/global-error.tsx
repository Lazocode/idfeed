/**
 * @file global-error.tsx
 * @description Componente de tratamento global de exceções não capturadas no Next.js App Router.
 * Define sua própria tag html e body para substituir a raiz caso o RootLayout falhe.
 * @module app/global-error
 * @recommendedPath src/app/global-error.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useEffect } from "react";

/**
 * Propriedades recebidas pelo componente de erro global.
 */
interface GlobalErrorProps {
  /** O objeto de erro capturado pela árvore do Next.js */
  error: Error & { digest?: string };
  /** Função de reinicialização da rota atual */
  reset: () => void;
}

/**
 * Componente de erro global raiz (GlobalError).
 *
 * @param props - Propriedades contendo o erro capturado e a ação de reset.
 * @returns Interface de recuperação de falha com html e body próprios.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log do erro crítico em produção ou monitoramento
    console.error("Erro crítico capturado no GlobalError:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2">
            Algo inesperado aconteceu
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Ocorreu uma falha no carregamento da aplicação. Você pode tentar recarregar a página.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
