/**
 * @file next-auth.d.ts
 * @description Extensão e aumento de módulos de tipos do NextAuth.js para tipagem estrita
 * dos dados customizados da sessão de usuário (`lojaId`, `papel`, `lojaStatus`).
 * @module lib/next-auth.d
 * @recommendedPath src/lib/next-auth.d.ts
 */

// 1. Dependências e bibliotecas externas
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Estrutura estendida do objeto de Sessão do NextAuth.
   */
  interface Session {
    user: {
      /** Identificador único do usuário no banco de dados (UUID). */
      id: string;
      /** Identificador único da oficina mecânica à qual o usuário pertence (UUID). */
      lojaId: string;
      /** Papel funcional do usuário no sistema ("admin", "mecanico", "atendente"). */
      papel: string;
      /** Status de aprovação cadastral da loja ("pendente", "aprovada", "rejeitada", "bloqueada"). */
      lojaStatus: string;
    } & DefaultSession["user"];
  }
}

