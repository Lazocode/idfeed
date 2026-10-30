/**
 * @file store-shell.tsx
 * @description Layout estrutural base (Shell) para as páginas do portal da oficina (loja).
 * @module components/store-shell
 * @recommendedPath src/components/store-shell.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React from "react";

/**
 * Propriedades do componente StoreShell.
 */
interface StoreShellProps {
  /** Conteúdo renderizado no interior do container da loja. */
  children: React.ReactNode;
}

/**
 * Componente cliente contêiner que provê encapsulamento estrutural para as telas do portal da oficina.
 *
 * @param props - Propriedades contendo os nós filhos.
 * @returns Elemento contêiner envolto na classe `store-app-shell`.
 */
export default function StoreShell({ children }: StoreShellProps) {
  return (
    <div className="store-app-shell">
      <main className="store-main">{children}</main>
    </div>
  );
}

