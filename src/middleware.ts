import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLojaRoute = pathname.startsWith("/loja");

  // Rotas públicas da área da loja.
  // /criar-conta precisa permanecer acessível sem autenticação para que
  // novos clientes consigam cadastrar a própria loja e o primeiro admin.
  const isPublicLojaRoute =
    pathname === "/loja/login" || pathname === "/loja/criar-conta";

  if (isLojaRoute && !isPublicLojaRoute && !req.auth) {
    const loginUrl = new URL("/loja/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/loja/:path*"],
};
