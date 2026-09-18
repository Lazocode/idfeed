/**
 * @file security.ts
 * @description Funções de controle de acesso (RBAC), autorização e guardas de rota no lado do servidor.
 * Assegura que páginas e ações sensíveis sejam executadas apenas por administradores ou oficinas ativas.
 * @module lib/security
 * @recommendedPath src/lib/security.ts
 */

// 1. Dependências e bibliotecas externas
import { redirect } from "next/navigation";

// 2. Bibliotecas e serviços internos
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Papéis de usuário suportados no sistema.
 */
export type Papel = "admin" | "mecanico" | "atendente";

/**
 * Status de ciclo de vida cadastral de uma oficina mecânica.
 */
export type StatusLoja =
  | "pendente"
  | "aprovada"
  | "rejeitada"
  | "bloqueada";

/**
 * Verifica de forma rígida se o usuário autenticado corresponde ao perfil de superadministrador (Lázaro Miranda).
 *
 * @param user - Objeto do usuário autenticado contendo e-mail, nome e papel.
 * @returns `true` se for o superadministrador do sistema; caso contrário, `false`.
 */
export function isLazaroMirandaAdmin(user?: { email?: string | null; name?: string | null; papel?: string | null } | null): boolean {
  if (!user || user.papel !== "admin") return false;
  const email = (user.email || "").trim().toLowerCase();
  const name = (user.name || "").trim().toLowerCase();
  return (
    email === "lazanha931@gmail.com" ||
    email === "mirandalazaro560@gmail.com" ||
    name.includes("lazaro") ||
    name.includes("lázaro")
  );
}

/**
 * Exige que o usuário esteja autenticado e possua o papel 'admin'
 * exclusivo de Lázaro Miranda para acessar áreas administrativas do sistema.
 *
 * @returns Sessão de autenticação válida com privilégio de administrador.
 * @throws Redireciona para `/admin/login` caso não esteja autenticado ou não autorizado.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/admin/login");
  }

  if (!isLazaroMirandaAdmin(session.user)) {
    redirect("/admin/login?erro=nao_autorizado");
  }

  return session;
}

/**
 * Exige que exista uma sessão de usuário autenticado válida no sistema.
 *
 * @returns Sessão do usuário logado.
 * @throws Redireciona para `/loja/login` se a sessão for inválida ou incompleta.
 */
export async function requireSession() {
  const session = await auth();

  if (
    !session?.user?.id ||
    !session.user.lojaId ||
    !session.user.papel
  ) {
    redirect("/loja/login");
  }

  return session;
}

/**
 * Exige que o usuário autenticado pertença a um dos papéis informados.
 *
 * @param roles - Lista de papéis permitidos para a rota ou operação.
 * @returns Sessão de autenticação do usuário.
 * @throws Redireciona para `/loja/dashboard` se o papel não for autorizado.
 */
export async function requireRole(roles: Papel[]) {
  const session = await requireSession();

  if (!roles.includes(session.user.papel as Papel)) {
    redirect("/loja/dashboard");
  }

  return session;
}

/**
 * Exige que a oficina mecânica vinculada ao usuário esteja com status 'aprovada'.
 * Redireciona lojas pendentes ou com pendência de documentos para a tela de envio.
 *
 * @returns Sessão de autenticação ativa da oficina aprovada.
 * @throws Redireciona conforme a condição cadastral da loja.
 */
export async function requireApprovedStore() {
  const session = await requireSession();

  const status = session.user.lojaStatus as StatusLoja;

  if (status === "pendente" || status === "rejeitada") {
    redirect("/loja/enviar-documento");
  }

  if (status === "bloqueada" || status !== "aprovada") {
    redirect("/loja/login");
  }

  return session;
}

/**
 * Guarda combinada: exige papel de usuário autorizado E que a oficina mecânica esteja devidamente aprovada no banco.
 * Realiza consulta em tempo real ao Supabase para verificar se não houve revogação recente de aprovação.
 *
 * @param roles - Papéis de usuário autorizados para a rota.
 * @returns Sessão de autenticação verificada.
 * @throws Redireciona para a tela de documentação, dashboard ou login caso reprovado.
 */
export async function requireApprovedRole(roles: Papel[]) {
  const session = await requireSession();

  if (!roles.includes(session.user.papel as Papel)) {
    redirect("/loja/dashboard");
  }

  const lojaId = session.user.lojaId;

  const { data: loja, error } = await supabaseAdmin
    .from("lojas")
    .select("status")
    .eq("id", lojaId)
    .single();

  if (error || !loja) {
    const fallbackStatus = session.user.lojaStatus as StatusLoja | undefined;
    if (fallbackStatus === "aprovada") {
      return session;
    }
    if (fallbackStatus === "pendente" || fallbackStatus === "rejeitada") {
      redirect("/loja/enviar-documento");
    }
    redirect("/loja/login");
  }

  const status = loja.status;

  if (status === "pendente" || status === "rejeitada") {
    redirect("/loja/enviar-documento");
  }

  if (status === "bloqueada" || status !== "aprovada") {
    redirect("/loja/login");
  }

  return session;
}
