/**
 * @file page.tsx
 * @description Painel principal (Dashboard) da oficina mecânica.
 * Exibe métricas de veículos cadastrados, estoque de materiais e insumos,
 * com suporte a busca textual higienizada contra PostgREST Filter Injection,
 * omissão de hashes sensíveis (`proprietario_cpf_hash`) e assinatura de URLs de fotos.
 * @module app/loja/dashboard/page
 * @recommendedPath src/app/loja/dashboard/page.tsx
 */

// 1. Componentes internos
import LojaDashboardView, {
  type VeiculoDashboard,
} from "@/components/loja-dashboard-view";

// 2. Bibliotecas e serviços internos
import { requireApprovedRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import { getSignedPhotoUrl } from "@/lib/photos";
import { sanitizeSearchQuery } from "@/lib/validation";

/**
 * Força a renderização dinâmica do painel para garantir que alterações no estoque
 * e veículos sejam refletidas imediatamente.
 */
export const dynamic = "force-dynamic";

/**
 * Metadados estáticos para a página do painel da oficina.
 */
export const metadata = {
  title: "Painel da Oficina • IDfeed",
  description:
    "Gerenciamento de veículos, estoque de peças e ordens de serviço da oficina.",
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
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  // Exige que o usuário possua papel de admin, mecânico ou atendente em oficina aprovada
  const session = await requireApprovedRole([
    "admin",
    "mecanico",
    "atendente",
  ]);

  const lojaId = session.user.lojaId;
  const { q } = await searchParams;

  // MITIGAÇÃO: PostgREST Filter Injection — remove metacaracteres sintáticos antes de interpolar no .or()
  const safeQuery = sanitizeSearchQuery(q);

  // 1. Busca os dados cadastrais da oficina
  const { data: loja } = await supabaseAdmin
    .from("lojas")
    .select("id, nome, cnpj, telefone, status, criado_em")
    .eq("id", lojaId)
    .single();

  // 2. Consulta veículos vinculados à oficina (excluindo proprietario_cpf_hash do payload enviado ao cliente)
  let veiculosQuery = supabaseAdmin
    .from("veiculos")
    .select(
      `
      id,
      loja_id,
      public_token,
      placa,
      modelo,
      proprietario_nome,
      proprietario_contato,
      km_atual,
      km_proxima_revisao,
      nota_proxima_revisao,
      criado_em,
      atualizado_em,
      ordens_servico(
        id,
        tipo_servico,
        km_no_servico,
        custo,
        observacao,
        criado_em,
        mecanico:usuarios(nome),
        pecas:ordem_servico_materiais(quantidade, material:materiais(nome))
      )
      `
    )
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });

  if (safeQuery) {
    veiculosQuery = veiculosQuery.or(
      `placa.ilike.%${safeQuery}%,modelo.ilike.%${safeQuery}%,proprietario_nome.ilike.%${safeQuery}%`
    );
  }
  const { data: veiculosBrutos } = await veiculosQuery;

  // 2.1 Busca fotos reais dos veículos cadastrados e assina as URLs de forma segura
  const veiculosIds = (veiculosBrutos || []).map((v) => v.id);
  let fotosPorVeiculo: Record<
    string,
    {
      id: string;
      legenda?: string | null;
      criado_em: string;
      url?: string | null;
    }[]
  > = {};

  if (veiculosIds.length > 0) {
    const { data: fotos } = await supabaseAdmin
      .from("fotos")
      .select("id, entidade_id, legenda, criado_em, url")
      .eq("entidade_tipo", "veiculo")
      .in("entidade_id", veiculosIds)
      .order("criado_em", { ascending: false });

    if (fotos && fotos.length > 0) {
      const fotosAssinadas = await Promise.all(
        fotos.map(async (f) => ({
          id: f.id,
          entidade_id: f.entidade_id,
          legenda: f.legenda,
          criado_em: f.criado_em,
          url: await getSignedPhotoUrl(f.url),
        }))
      );

      fotosPorVeiculo = fotosAssinadas.reduce((acc, f) => {
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

  const veiculos: VeiculoDashboard[] = (veiculosBrutos || []).map((v) => ({
    ...v,
    ordens_servico: (v.ordens_servico || []).map((os) => ({
      id: os.id,
      tipo_servico: os.tipo_servico,
      km_no_servico: os.km_no_servico,
      custo: os.custo,
      observacao: os.observacao,
      criado_em: os.criado_em,
      mecanico: Array.isArray(os.mecanico)
        ? os.mecanico[0] ?? null
        : os.mecanico ?? null,
      pecas: (os.pecas || []).map((p) => ({
        quantidade: p.quantidade,
        material: Array.isArray(p.material)
          ? p.material[0] ?? null
          : p.material ?? null,
      })),
    })),
    fotos: fotosPorVeiculo[v.id] || [],
  }));

  // 3. Consulta materiais em estoque com filtro opcional higienizado por nome ou código SKU
  let materiaisQuery = supabaseAdmin
    .from("materiais")
    .select(
      "id, loja_id, nome, sku, localizacao, quantidade_atual, quantidade_minima, criado_em, atualizado_em"
    )
    .eq("loja_id", lojaId)
    .order("criado_em", { ascending: false });

  if (safeQuery) {
    materiaisQuery = materiaisQuery.or(
      `nome.ilike.%${safeQuery}%,sku.ilike.%${safeQuery}%`
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
      veiculos={veiculos}
      materiais={materiais || []}
      query={safeQuery}
    />
  );
}
