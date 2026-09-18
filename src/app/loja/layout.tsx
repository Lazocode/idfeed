/**
 * @file layout.tsx
 * @description Layout estrutural para todas as rotas da área de oficinas (`/loja/*`).
 * Envolve as páginas no componente StoreShell com verificação contextual da loja.
 * @module app/loja/layout
 * @recommendedPath src/app/loja/layout.tsx
 */

// 1. Dependências e bibliotecas externas
import React from "react";

// 2. Componentes internos
import StoreShell from "@/components/store-shell";

/**
 * Propriedades do componente LojaLayout.
 */
interface LojaLayoutProps {
  children: React.ReactNode;
}

/**
 * Componente funcional de layout para as rotas da oficina.
 *
 * @param props - Propriedades do layout contendo os nós filhos.
 * @param props.children - Conteúdo das páginas filhas da loja.
 * @returns Shell contextual da loja contendo os elementos da página.
 */
export default function LojaLayout({ children }: LojaLayoutProps) {
  return <StoreShell>{children}</StoreShell>;
}

