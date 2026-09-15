import { requireApprovedRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import LojaDashboardView from "@/components/loja-dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireApprovedRole([
    "admin",
    "mecanico",
    "atendente",
  ]);

  const lojaId = session.user.lojaId;
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const { data: loja } = await supabaseAdmin
    .from("lojas")
    .select("*")
    .eq("id", lojaId)
    .single();

  let veiculosQuery = supabaseAdmin
    .from("veiculos")
    .select("*")
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });
  if (query) {
    veiculosQuery = veiculosQuery.or(
      `placa.ilike.%${query}%,modelo.ilike.%${query}%,proprietario_nome.ilike.%${query}%`
    );
  }
  const { data: veiculos } = await veiculosQuery;

  let materiaisQuery = supabaseAdmin
    .from("materiais")
    .select("*")
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });
  if (query) {
    materiaisQuery = materiaisQuery.or(
      `nome.ilike.%${query}%,sku.ilike.%${query}%`
    );
  }
  const { data: materiais } = await materiaisQuery;

  return (
    <LojaDashboardView
      loja={loja}
      user={{
        nome: session.user.name,
        email: session.user.email,
        role: session.user.papel,
      }}
      veiculos={veiculos || []}
      materiais={materiais || []}
      query={query}
    />
  );
}
