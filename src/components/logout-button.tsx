/**
 * @file logout-button.tsx
 * @description Componente de botão de encerramento de sessão (Logout) integrado ao NextAuth.js.
 * Aciona o fluxo de sign-out limpando cookies de autenticação e redirecionando para a rota indicada.
 * @module components/logout-button
 * @recommendedPath src/components/logout-button.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React from "react";
import { signOut } from "next-auth/react";

/**
 * Propriedades do componente `LogoutButton`.
 */
interface LogoutButtonProps {
  /** Rota de redirecionamento após o logout (default: "/"). */
  redirectTo?: string;
  /** Conteúdo textual ou elementos filhos do botão (default: "Sair"). */
  children?: React.ReactNode;
  /** Classes CSS customizadas do Tailwind ou folhas de estilo. */
  className?: string;
  /** Estilos inline opcionais para customizações pontuais. */
  style?: React.CSSProperties;
}

/**
 * Componente cliente do botão de logout.
 *
 * @param props - Propriedades de configuração do botão.
 * @returns Elemento de botão interativo com acionamento do signOut.
 */
export default function LogoutButton({
  redirectTo = "/",
  children,
  className = "btn-ghost",
  style,
}: LogoutButtonProps = {}) {
  return (
    <button
      id="btn-logout"
      type="button"
      onClick={() => signOut({ callbackUrl: redirectTo })}
      className={className}
      style={style || { fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}
    >
      {children || "Sair"}
    </button>
  );
}

