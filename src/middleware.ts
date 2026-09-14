import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLojaRoute = pathname.startsWith("/loja");
  const isAdminRoute = pathname.startsWith("/admin");

  // Rotas públicas da área da loja.
  // /criar-conta precisa permanecer acessível sem autenticação para que
  // novos clientes consigam cadastrar a própria loja e o primeiro admin.
  const isPublicLojaRoute =
    pathname === "/loja/login" || pathname === "/loja/criar-conta";

  const isAuthenticated = !!req.auth?.user;

  // Se o usuário já estiver autenticado e tentar acessar /loja/login, redireciona para o dashboard
  if (pathname === "/loja/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/loja/dashboard", req.url));
  }

  if (
    (isLojaRoute && !isPublicLojaRoute && !isAuthenticated) ||
    (isAdminRoute && !isAuthenticated)
  ) {
    const loginUrl = new URL("/loja/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/loja/:path*", "/admin/:path*"],
};
