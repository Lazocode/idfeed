/**
 * @file middleware.ts
 * @description Middleware global do Next.js para controle de autenticação e autorização por papéis (RBAC).
 * Intercepta e protege rotas administrativas (`/admin/*`) e rotas operacionais de oficina (`/loja/*`),
 * redirecionando usuários não autenticados ou não autorizados com base na sessão do NextAuth.js.
 * @module middleware
 * @recommendedPath src/middleware.ts
 */

// 1. Dependências e bibliotecas externas
import { NextResponse } from "next/server";

// 2. Bibliotecas e serviços internos
import { auth } from "@/lib/auth";

/**
 * Middleware acoplado ao NextAuth para validação de requisições sensíveis.
 *
 * @param req - Requisição Next.js enriquecida com a propriedade `auth` contendo a sessão ativa.
 * @returns `NextResponse.redirect` se a rota requerer credenciais/autorizações específicas, ou `NextResponse.next()`.
 */
export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLojaRoute = pathname.startsWith("/loja");
  const isAdminRoute = pathname.startsWith("/admin");

  // 1. Definição de rotas públicas que dispensam sessão prévia
  const isPublicLojaRoute =
    pathname === "/loja/login" || pathname === "/loja/criar-conta";
  const isPublicAdminRoute = pathname === "/admin/login";

  // 2. Extração de informações de identidade e privilégio do usuário
  const isAuthenticated = !!req.auth?.user;
  const userPapel = req.auth?.user?.papel;
  const userEmail = req.auth?.user?.email?.toLowerCase() || "";
  const userName = req.auth?.user?.name?.toLowerCase() || "";

  // 3. Regra de autorização estrita para o painel de superadministrador
  // MITIGAÇÃO: Name spoofing / Privilege Escalation. Verificação estrita contra e-mails oficiais.
  const isLazaroAdmin =
    userPapel === "admin" &&
    (userEmail === "lazanha931@gmail.com" ||
      userEmail === "mirandalazaro560@gmail.com");


  // 4. Redireciona usuários já autenticados que tentam acessar páginas de login
  if (pathname === "/loja/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/loja/dashboard", req.url));
  }

  if (pathname === "/admin/login" && isAuthenticated && isLazaroAdmin) {
    return NextResponse.redirect(new URL("/admin/aprovacoes", req.url));
  }

  // 5. Proteção de rotas restritas da loja (exige autenticação)
  if (isLojaRoute && !isPublicLojaRoute && !isAuthenticated) {
    const loginUrl = new URL("/loja/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 6. Proteção de rotas do administrador (exige autenticação e papel de superadmin)
  if (isAdminRoute && !isPublicAdminRoute) {
    if (!isAuthenticated) {
      const adminLoginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(adminLoginUrl);
    }

    if (!isLazaroAdmin) {
      const unauthorizedUrl = new URL(
        "/admin/login?erro=nao_autorizado",
        req.url
      );
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  return NextResponse.next();
});

/**
 * Padrões de rotas monitoradas pelo Middleware.
 */
export const config = {
  matcher: ["/loja/:path*", "/admin/:path*"],
};

