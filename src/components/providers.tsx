/**
 * @file providers.tsx
 * @description Provedor global de contexto de cliente da aplicação.
 * Envolve a árvore de componentes com o `SessionProvider` do NextAuth para viabilizar o uso do hook `useSession`.
 * @module components/providers
 * @recommendedPath src/components/providers.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import { SessionProvider } from "next-auth/react";
import React, { ReactNode } from "react";

/**
 * Propriedades para o componente Providers.
 */
interface ProvidersProps {
  /** Elementos filhos encapsulados pelo provedor de sessão. */
  children: ReactNode;
}

/**
 * Componente cliente que disponibiliza o contexto de autenticação a todos os componentes filhos.
 *
 * @param props - Propriedades contendo os nós filhos da aplicação.
 * @returns Componente envelopado no SessionProvider.
 */
export default function Providers({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}

