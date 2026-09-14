import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLojaRoute = pathname.startsWith("/loja");
  const isAdminRoute = pathname.startsWith("/admin");

  // Rotas públicas
  const isPublicLojaRoute =
    pathname === "/loja/login" || pathname === "/loja/criar-conta";
  const isPublicAdminRoute = pathname === "/admin/login";

  const isAuthenticated = !!req.auth?.user;
  const userPapel = req.auth?.user?.papel;
  const userEmail = req.auth?.user?.email?.toLowerCase() || "";
  const userName = req.auth?.user?.name?.toLowerCase() || "";
  const isLazaroAdmin =
    userPapel === "admin" &&
    (userEmail === "lazanha931@gmail.com" ||
      userEmail === "mirandalazaro560@gmail.com" ||
      userName.includes("lazaro") ||
      userName.includes("lázaro"));

  // Se o usuário já estiver autenticado e tentar acessar as páginas de login
  if (pathname === "/loja/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/loja/dashboard", req.url));
  }

  if (pathname === "/admin/login" && isAuthenticated && isLazaroAdmin) {
    return NextResponse.redirect(new URL("/admin/aprovacoes", req.url));
  }

  // Proteção de rotas da loja
  if (isLojaRoute && !isPublicLojaRoute && !isAuthenticated) {
    const loginUrl = new URL("/loja/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Proteção de rotas do admin: apenas Lázaro Miranda com papel "admin"
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

export const config = {
  matcher: ["/loja/:path*", "/admin/:path*"],
};
