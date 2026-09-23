/**
 * @file page.tsx
 * @description Painel principal (Dashboard) da oficina mecânica.
 * Exibe métricas de veículos cadastrados, estoque de materiais e insumos,
 * com suporte a busca textual por placa, modelo, proprietário, nome de material e SKU.
 * @module app/loja/dashboard/page
 * @recommendedPath src/app/loja/dashboard/page.tsx
 */

// 1. Componentes internos
import LojaDashboardView from "@/components/loja-dashboard-view";

// 2. Bibliotecas e serviços internos
import { requireApprovedRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Força a renderização dinâmica do painel para garantir que alterações no estoque
 * e veículos sejam refletidas imediatamente.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos para a página do painel da oficina.
 */
export const metadata = {
  title: "Painel da Oficina • IDfleet",
  description: "Gerenciamento de veículos, estoque de peças e ordens de serviço da oficina.",
};

/**
 * Interface tipada para os parâmetros de busca na URL do dashboard.
 */
interface DashboardPageProps {
  searchParams: Promise<{ q?: string }>;
}

/**
 * Componente assíncrono da Página do Painel da Oficina (Dashboard).
 *
 * @param props - Propriedades contendo a Promise com o termo de busca `searchParams.q`.
 * @returns Interface do dashboard com veículos e materiais filtrados.
 */
export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  // Exige que o usuário possua papel de admin, mecânico ou atendente em oficina aprovada
  const session = await requireApprovedRole([
    "admin",
    "mecanico",
    "atendente",
  ]);

  const lojaId = session.user.lojaId;
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  // 1. Busca os dados cadastrais da oficina
  const { data: loja } = await supabaseAdmin
    .from("lojas")
    .select("*")
    .eq("id", lojaId)
    .single();

  // 2. Consulta veículos vinculados à oficina com ordens de serviço reais
  let veiculosQuery = supabaseAdmin
    .from("veiculos")
    .select(
      `*, ordens_servico(*, mecanico:usuarios(nome), pecas:ordem_servico_materiais(quantidade, material:materiais(nome)))`
    )
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });

  if (query) {
    veiculosQuery = veiculosQuery.or(
      `placa.ilike.%${query}%,modelo.ilike.%${query}%,proprietario_nome.ilike.%${query}%`
    );
  }
  const { data: veiculosBrutos } = await veiculosQuery;

  // 2.1 Busca fotos reais dos veículos cadastrados
  const veiculosIds = (veiculosBrutos || []).map((v) => v.id);
  let fotosPorVeiculo: Record<
    string,
    { id: string; legenda?: string | null; criado_em: string; url?: string | null }[]
  > = {};

  if (veiculosIds.length > 0) {
    const { data: fotos } = await supabaseAdmin
      .from("fotos")
      .select("id, entidade_id, legenda, criado_em, url")
      .eq("entidade_tipo", "veiculo")
      .in("entidade_id", veiculosIds)
      .order("criado_em", { ascending: false });

    if (fotos) {
      fotosPorVeiculo = fotos.reduce((acc, f) => {
        if (!acc[f.entidade_id]) acc[f.entidade_id] = [];
        acc[f.entidade_id].push({
          id: f.id,
          legenda: f.legenda,
          criado_em: f.criado_em,
          url: f.url,
        });
        return acc;
      }, {} as typeof fotosPorVeiculo);
    }
  }

  const veiculos = (veiculosBrutos || []).map((v) => ({
    ...v,
    fotos: fotosPorVeiculo[v.id] || [],
  }));

  // 3. Consulta materiais em estoque com filtro opcional por nome ou código SKU
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

  // 4. Renderiza a visualização consolidada do painel
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

