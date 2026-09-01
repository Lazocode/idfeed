import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";
import { checkLoginRateLimit } from "./rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/loja/login",
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

      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const senha = credentials?.senha as string | undefined;

        if (!email || !senha) {
          return null;
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Proteção contra tentativas excessivas de login
        if (!checkLoginRateLimit(`login:${normalizedEmail}`)) {
          return null;
        }

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

        // Verifica a senha
        const senhaValida = await bcrypt.compare(
          senha,
          usuario.senha_hash
        );

        if (!senhaValida) {
          return null;
        }

        // Supabase pode retornar a relação como objeto ou array.
        const loja = Array.isArray(usuario.loja)
          ? usuario.loja[0]
          : usuario.loja;

        if (!loja) {
          console.error("LOJA NÃO ENCONTRADA PARA O USUÁRIO:", usuario.id);
          return null;
        }

        // IMPORTANTE:
        // Aqui NÃO bloqueamos mais a loja pendente.
        // O status será enviado para a sessão e o LoginForm
        // decidirá para qual página o usuário será encaminhado.

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          lojaId: usuario.loja_id,
          papel: usuario.papel,
          lojaStatus: loja.status,
        };
      },
    }),
  ],

  callbacks: {
    // Coloca os dados necessários dentro do JWT
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

    // Disponibiliza os dados na sessão
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