import { auth } from "@/lib/auth";

export type Papel = "admin" | "mecanico" | "atendente";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.lojaId || !session.user.papel) {
    throw new Error("Não autenticado.");
  }
  return session;
}

export async function requireRole(roles: Papel[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.papel as Papel)) throw new Error("Você não tem permissão para esta operação.");
  return session;
}
