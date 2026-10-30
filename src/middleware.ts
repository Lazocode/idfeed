/**
 * @file middleware.ts
 * @description Middleware global do Next.js para controle de autenticação e autorização por papéis (RBAC).
 * Intercepta e protege rotas administrativas (`/admin/*`), rotas operacionais de oficina (`/loja/*`) e
 * APIs restritas (`/api/documentos-oficina`), redirecionando ou bloqueando requisições não autorizadas.
 * @module middleware
 * @recommendedPath src/middleware.ts
 */

// Higienização defensiva de variáveis de ambiente com aspas literais
if (process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL.replace(/^["']|["']$/g, "").trim();
}
if (process.env.AUTH_URL) {
  process.env.AUTH_URL = process.env.AUTH_URL.replace(/^["']|["']$/g, "").trim();
} else if (process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
}

// 1. Dependências e bibliotecas externas
import { NextResponse } from "next/server";

// 2. Bibliotecas e serviços internos
import { auth } from "@/lib/auth";
import { isLazaroMirandaAdmin } from "@/lib/security";

/**
 * Middleware acoplado ao NextAuth para validação de requisições sensíveis.
 *
 * @param req - Requisição Next.js enriquecida com a propriedade `auth` contendo a sessão ativa.
 * @returns `NextResponse.redirect` ou `NextResponse.json(401)` se a rota requerer credenciais/autorizações específicas, ou `NextResponse.next()`.
 */
export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLojaRoute = pathname.startsWith("/loja");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedApiRoute = pathname.startsWith("/api/documentos-oficina");

  // 1. Definição de rotas públicas que dispensam sessão prévia
  const isPublicLojaRoute =
    pathname === "/loja/login" || pathname === "/loja/criar-conta";
  const isPublicAdminRoute = pathname === "/admin/login";

  // 2. Extração de informações de identidade e privilégio do usuário
  const isAuthenticated = !!req.auth?.user?.id;
  const isLazaroAdmin = isLazaroMirandaAdmin(req.auth?.user);

  // 3. Proteção na borda para rotas de API restritas
  if (isProtectedApiRoute && !isAuthenticated) {
    return NextResponse.json(
      { error: "Sessão inválida ou não autenticada." },
      { status: 401 }
    );
  }

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
  matcher: ["/loja/:path*", "/admin/:path*", "/api/documentos-oficina/:path*"],
};
