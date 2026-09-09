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
    throw new Error("Não autenticado.");
  }

  return session;
}

/**
 * Exige que o usuário tenha um dos papéis informados.
 */
export async function requireRole(roles: Papel[]) {
  const session = await requireSession();

  if (!roles.includes(session.user.papel as Papel)) {
    throw new Error(
      "Você não tem permissão para esta operação."
    );
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

  if (status === "pendente") {
    throw new Error(
      "Sua oficina ainda está aguardando aprovação."
    );
  }

  if (status === "rejeitada") {
    throw new Error(
      "O cadastro da sua oficina foi rejeitado."
    );
  }

  if (status === "bloqueada") {
    throw new Error(
      "O acesso desta oficina está bloqueado."
    );
  }

  if (status !== "aprovada") {
    throw new Error(
      "Não foi possível identificar o status da oficina."
    );
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
    throw new Error("Você não tem permissão para esta operação.");
  }

  const lojaId = session.user.lojaId;

  const { data: loja, error } = await supabaseAdmin
    .from("lojas")
    .select("status")
    .eq("id", lojaId)
    .single();

  if (error || !loja) {
    throw new Error("Oficina não encontrada.");
  }

  const status = loja.status;

  if (status === "pendente") {
    redirect("/loja/enviar-documento");
  }

  if (status === "rejeitada") {
    redirect("/loja/enviar-documento");
  }

  if (status === "bloqueada") {
    throw new Error("O acesso desta oficina está bloqueado.");
  }

  if (status !== "aprovada") {
    throw new Error("Status da oficina inválido.");
  }

  return session;
}