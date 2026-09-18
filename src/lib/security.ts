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
 * E-mails explicitamente autorizados com privilégios irrestritos de superadministrador.
 * MITIGAÇÃO: Privilege Escalation & Name Spoofing Attack.
 * NUNCA utilize substrings de nomes de exibição (ex: name.includes("lazaro")), pois são mutáveis
 * e permitem que qualquer usuário crie uma conta com esse nome e obtenha acesso superadmin.
 */
const SUPERADMIN_EMAILS: ReadonlySet<string> = new Set([
  "lazanha931@gmail.com",
  "mirandalazaro560@gmail.com",
]);

/**
 * Verifica de forma rígida se o usuário autenticado corresponde ao perfil de superadministrador.
 *
 * MITIGAÇÃO: Bypass de Autorização Administrativa (Broken Access Control).
 * Por que elimina a brecha: Exige estritamente o papel "admin" E verificação contra a lista branca
 * imutável de e-mails de superadministradores, rejeitando comparações frouxas de strings no nome do usuário.
 * COMPORTAMENTO DEFENSIVO: Retorna `false` imediatamente para qualquer usuário fora da lista autorizada.
 *
 * @param user - Objeto do usuário autenticado contendo e-mail e papel.
 * @returns `true` se for o superadministrador legítimo; caso contrário, `false`.
 */
export function isLazaroMirandaAdmin(user?: { email?: string | null; papel?: string | null } | null): boolean {
  if (!user || user.papel !== "admin") return false;
  const email = (user.email || "").trim().toLowerCase();
  return SUPERADMIN_EMAILS.has(email);
}

/**
 * Exige papel autorizado E status de oficina homologada para execução segura de Server Actions.
 *
 * MITIGAÇÃO: IDOR & Bypass de Autorização Multi-tenant em ações de mutação (Server Actions).
 * Por que elimina a brecha: Garante que oficinas suspensas, rejeitadas, pendentes ou bloqueadas não
 * possam injetar requisições diretas via RPC/Server Actions para criar veículos, alterar ordens de serviço
 * ou manipular inventário sem aprovação prévia da plataforma.
 * COMPORTAMENTO DEFENSIVO: Lança exceção tipada sem redirecionamento abrupto, permitindo tratamento defensivo na UI.
 *
 * @param roles - Lista de papéis autorizados para a ação.
 * @returns Sessão validada e dados da loja autorizada.
 * @throws {Error} Se não autenticado, sem permissão ou loja não aprovada.
 */
export async function requireApprovedAction(roles: Papel[]) {
  const session = await auth();

  if (!session?.user?.id || !session.user.lojaId || !session.user.papel) {
    throw new Error("Sessão inválida ou expirada. Faça login novamente.");
  }

  if (!roles.includes(session.user.papel as Papel)) {
    throw new Error("Acesso não autorizado para o perfil do usuário.");
  }

  // Verifica status da oficina em tempo real no banco para revogação imediata
  const { data: loja, error } = await supabaseAdmin
    .from("lojas")
    .select("status")
    .eq("id", session.user.lojaId)
    .single();

  const status = loja?.status || (session.user.lojaStatus as StatusLoja);

  if (error || !status || status !== "aprovada") {
    throw new Error("Operação bloqueada: Oficina não homologada ou com pendências cadastrais.");
  }

  return session;
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
