/**
 * @file auth.ts
 * @description Configuração central do NextAuth.js v5 para autenticação baseada em credenciais (E-mail e Senha).
 * Inclui validação de senhas com bcrypt, proteção contra força bruta via Rate Limiting,
 * isolamento de tenant por oficina (lojaId) e injeção do papel administrativo com RBAC.
 * @module lib/auth
 * @recommendedPath src/lib/auth.ts
 */

// 1. Dependências e bibliotecas externas
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// 2. Bibliotecas e serviços internos
import { supabaseAdmin } from "@/lib/supabase";
import { checkLoginRateLimit, clearLoginRateLimit } from "@/lib/rate-limit";

/**
 * Instância e métodos expostos do NextAuth (handlers HTTP, auth, signIn, signOut).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    "default-secret-lote-app-dev-key-change-in-prod",
  session: {
    strategy: "jwt",
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
       * @returns Objeto de usuário para montagem do token ou `null` se inválido/bloqueado.
       */
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const senha = credentials?.senha as string | undefined;

        if (!email || !senha) {
          return null;
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Proteção contra tentativas excessivas de login (Rate Limiting)
        if (!checkLoginRateLimit(`login:${normalizedEmail}`)) {
          return null;
        }

        // 2. Consulta o usuário e o status da loja vinculada no banco de dados
        const { data: usuario, error } = await supabaseAdmin
          .from("usuarios")
          .select(`
            id,
            nome,
            email,
            senha_hash,
            loja_id,
            papel,
            loja:lojas(status)
          `)
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (error) {
          console.error("ERRO AO BUSCAR USUÁRIO:", error);
          return null;
        }

        if (!usuario) {
          return null;
        }

        // 3. Validação do hash criptográfico da senha informada
        const senhaValida = await bcrypt.compare(
          senha,
          usuario.senha_hash
        );

        if (!senhaValida) {
          return null;
        }

        // 4. Limpa o rate limit após autenticação bem-sucedida
        clearLoginRateLimit(`login:${normalizedEmail}`);

        // 5. Normaliza a relação com a loja (Supabase pode retornar objeto ou array)
        const loja = Array.isArray(usuario.loja)
          ? usuario.loja[0]
          : usuario.loja;

        if (!loja) {
          console.error("LOJA NÃO ENCONTRADA PARA O USUÁRIO:", usuario.id);
          return null;
        }

        // 6. Regra de autorização estrita para privilégios de superadministrador
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
        token.lojaStatus = (
          user as { lojaStatus: string }
        ).lojaStatus;
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
