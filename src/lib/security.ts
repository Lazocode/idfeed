import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export type Papel = "admin" | "mecanico" | "atendente";

export type StatusLoja =
  | "pendente"
  | "aprovada"
  | "rejeitada"
  | "bloqueada";

/**
 * Exige que exista uma sessão válida.
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
 * Exige que o usuário tenha um dos papéis informados.
 */
export async function requireRole(roles: Papel[]) {
  const session = await requireSession();

  if (!roles.includes(session.user.papel as Papel)) {
    redirect("/loja/dashboard");
  }

  return session;
}

/**
 * Exige que a oficina esteja aprovada.
 *
 * Use esta função nas páginas que fazem parte
 * do sistema operacional da oficina.
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
 * Exige papel + oficina aprovada.
 *
 * É a função que usaremos na maioria das páginas
 * internas da oficina.
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