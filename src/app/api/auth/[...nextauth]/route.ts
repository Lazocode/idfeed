/**
 * @file route.ts
 * @description Endpoint do NextAuth.js para captura de rotas de autenticação (GET e POST).
 * Roteia automaticamente chamadas de callback, sessão, providers, CSRF token e credenciais.
 * @module app/api/auth/[...nextauth]/route
 * @recommendedPath src/app/api/auth/[...nextauth]/route.ts
 */

// 1. Bibliotecas e serviços internos
import { handlers } from "@/lib/auth";

/**
 * Handlers HTTP (GET e POST) exportados pelo NextAuth v5.
 * Processam requisições como `/api/auth/signin`, `/api/auth/callback/credentials`, `/api/auth/session`, etc.
 */
export const { GET, POST } = handlers;

