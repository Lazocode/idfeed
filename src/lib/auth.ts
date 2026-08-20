import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";
import { checkLoginRateLimit } from "./rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/loja/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const senha = credentials?.senha as string | undefined;
        if (!email || !senha) return null;
        const normalizedEmail = email.trim().toLowerCase();
        if (!checkLoginRateLimit(`login:${normalizedEmail}`)) return null;

        const { data: usuario } = await supabaseAdmin
          .from("usuarios")
          .select("id, nome, email, senha_hash, loja_id, papel")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (!usuario) return null;

        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) return null;

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          lojaId: usuario.loja_id,
          papel: usuario.papel,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.lojaId = (user as { lojaId: string }).lojaId;
        token.papel = (user as { papel: string }).papel;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.lojaId = token.lojaId as string;
        session.user.papel = token.papel as string;
      }
      return session;
    },
  },
});
