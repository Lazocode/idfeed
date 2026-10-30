/**
 * @file auth.ts
 * @description Configuração central do NextAuth.js v5 para autenticação baseada em credenciais (E-mail e Senha).
 * Inclui validação de senhas com bcrypt em tempo constante (anti-enumeração), proteção contra força bruta via Rate Limiting
 * por IP e e-mail, bloqueio imediato de oficinas suspensas, isolamento de tenant por oficina (lojaId) e RBAC.
 * @module lib/auth
 * @recommendedPath src/lib/auth.ts
 */

// 1. Dependências e bibliotecas externas
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Higienização defensiva de variáveis com aspas literais
if (process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL.replace(/^["']|["']$/g, "").trim();
}
if (process.env.AUTH_URL) {
  process.env.AUTH_URL = process.env.AUTH_URL.replace(/^["']|["']$/g, "").trim();
} else if (process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
}

// 2. Bibliotecas e serviços internos
import { supabaseAdmin } from "@/lib/supabase";
import { checkLoginRateLimit, clearLoginRateLimit } from "@/lib/rate-limit";

/**
 * Hash bcrypt fictício pré-computado (custo 12) para mitigar ataques de temporização (Timing Attack)
 * quando um endereço de e-mail inexistente é consultado no login.
 */
const DUMMY_BCRYPT_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oL9S1bK6G";

/**
 * Resolve o segredo criptográfico de assinatura de sessão do NextAuth.
 * Em ambiente de produção, exige obrigatoriamente uma chave configurada no ambiente.
 *
 * @returns Segredo de assinatura JWT.
 * @throws {Error} Se `AUTH_SECRET` / `NEXTAUTH_SECRET` estiver ausente em produção.
 */
function resolveAuthSecret(): string {
  const configured = (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ""
  ).trim();

  if (configured.length >= 16) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ERRO CRÍTICO DE SEGURANÇA: AUTH_SECRET (ou NEXTAUTH_SECRET) deve ser configurado em produção."
    );
  }

  return "dev-only-secret-lote-app-local-environment-key";
}

/**
 * Instância e métodos expostos do NextAuth (handlers HTTP, auth, signIn, signOut).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveAuthSecret(),
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas de validade máxima de sessão
  },

  pages: {
    signIn: "/loja/login",
    error: "/loja/login",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "E-mail",
          type: "email",
        },
        senha: {
          label: "Senha",
          type: "password",
        },
      },

      /**
       * Função de autorização de credenciais de login.
       *
       * @param credentials - Objeto com `email` e `senha` enviados pelo usuário.
       * @param request - Objeto `Request` da requisição HTTP para extração de IP.
       * @returns Objeto de usuário para montagem do token ou `null` se inválido/bloqueado.
       */
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const senha = credentials?.senha as string | undefined;

        if (
          !email ||
          !senha ||
          typeof email !== "string" ||
          typeof senha !== "string" ||
          email.length > 254 ||
          senha.length > 128
        ) {
          return null;
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Extrai o endereço IP para proteção contra Credential Stuffing distribuído por conta ou único IP
        const clientIp =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          "unknown-ip";

        // 1. Proteção contra tentativas excessivas de login (Rate Limiting por E-mail e IP)
        const emailAllowed = checkLoginRateLimit(`login:email:${normalizedEmail}`);
        const ipAllowed = checkLoginRateLimit(`login:ip:${clientIp}`);

        if (!emailAllowed || !ipAllowed) {
          return null;
        }

        // 2. Consulta o usuário e o status da loja vinculada no banco de dados
        const { data: usuario, error } = await supabaseAdmin
          .from("usuarios")
          .select(
            `
            id,
            nome,
            email,
            senha_hash,
            loja_id,
            papel,
            loja:lojas(status)
          `
          )
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (error) {
          console.error("ERRO AO BUSCAR USUÁRIO:", error);
          return null;
        }

        // 3. Mitigação de Timing Attack: executa bcrypt.compare mesmo se o usuário não existir
        if (!usuario) {
          await bcrypt.compare(senha, DUMMY_BCRYPT_HASH);
          return null;
        }

        // 4. Validação do hash criptográfico da senha informada
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
          return null;
        }

        // 5. Normaliza a relação com a loja (Supabase pode retornar objeto ou array)
        const loja = Array.isArray(usuario.loja)
          ? usuario.loja[0]
          : usuario.loja;

        if (!loja || loja.status === "bloqueada") {
          return null;
        }

        // 6. Limpa o rate limit após autenticação bem-sucedida
        clearLoginRateLimit(`login:email:${normalizedEmail}`);
        clearLoginRateLimit(`login:ip:${clientIp}`);

        // 7. Regra de autorização estrita para privilégios de superadministrador
        // MITIGAÇÃO: Name spoofing privilege escalation. Verificação exclusivamente por e-mails canônicos.
        const isLazaroMiranda =
          normalizedEmail === "lazanha931@gmail.com" ||
          normalizedEmail === "mirandalazaro560@gmail.com";

        const papelEfetivo =
          usuario.papel === "admin" && !isLazaroMiranda
            ? "mecanico"
            : usuario.papel;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          lojaId: usuario.loja_id,
          papel: papelEfetivo,
          lojaStatus: loja.status,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * Callback acionado na criação ou atualização do JSON Web Token (JWT).
     * Armazena lojaId, papel e lojaStatus dentro do payload criptografado.
     */
    jwt({ token, user }) {
      if (user) {
        token.lojaId = (user as { lojaId: string }).lojaId;
        token.papel = (user as { papel: string }).papel;
        token.lojaStatus = (user as { lojaStatus: string }).lojaStatus;
      }

      return token;
    },

    /**
     * Callback acionado na leitura da sessão pelo cliente ou servidor.
     * Repassa as claims do token para a propriedade `session.user`.
     */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.lojaId = token.lojaId as string;
        session.user.papel = token.papel as string;
        session.user.lojaStatus = token.lojaStatus as string;
      }

      return session;
    },
  },
});
