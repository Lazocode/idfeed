/**
 * @file next.config.ts
 * @description Configuração principal do Next.js para o sistema IDV / LOTE.
 * Aplica cabeçalhos HTTP de segurança (Defense in Depth), oculta cabeçalho X-Powered-By
 * e sanitiza variáveis de ambiente de autenticação apenas no escopo do servidor.
 * @module next.config
 * @recommendedPath next.config.ts
 */

// 1. Dependências e bibliotecas externas
import type { NextConfig } from "next";

// Sanitiza NEXTAUTH_URL no processo Node.js caso venha envolvida por aspas literais do ambiente de hospedagem.
// Nota: Não expomos NEXTAUTH_URL/AUTH_URL no bloco `env` público para evitar vazamento de topologia interna no bundle cliente.
const cleanNextAuthUrl = process.env.NEXTAUTH_URL?.replace(/^["']|["']$/g, "").trim();
if (cleanNextAuthUrl) {
  process.env.NEXTAUTH_URL = cleanNextAuthUrl;
  process.env.AUTH_URL = cleanNextAuthUrl;
}

/**
 * Cabeçalhos HTTP de segurança aplicados globalmente a todas as rotas da aplicação.
 * Mitiga Clickjacking, MIME-sniffing, vazamento de Referer e abuso de APIs sensíveis do navegador.
 */
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
