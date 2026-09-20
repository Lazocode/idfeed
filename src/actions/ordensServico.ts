/**
 * @file ordensServico.ts
 * @description Server Actions para gerenciamento de ordens de serviço (OS) e manutenções veiculares.
 * Executa a procedure atômica `criar_ordem_servico`, baixando peças do estoque e atualizando o odômetro do veículo.
 * @module actions/ordensServico
 * @recommendedPath src/actions/ordensServico.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import { redirect } from "next/navigation";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { requireApprovedAction } from "@/lib/security";
import { serviceSchema } from "@/lib/validation";

/**
 * Estrutura de insumos/peças utilizados em uma ordem de manutenção veicular.
 */
export interface ItemPecaUtilizada {
  material_id: string;
  quantidade: number;
}

/**
 * Expressão regular estrita para validação de UUID v4.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Registra uma nova ordem de serviço para um veículo com validação defensiva e sanitização de RPC.
 *
 * MITIGAÇÃO:
 * - Manipulação de RPC & Injeção JSON: Valida, sanitiza, deduplica e limita o array de peças (`p_pecas`).
 * - Fraude de Odômetro (Hodômetro Adulterado): Garante que a quilometragem do serviço seja estritamente
 *   maior ou igual à quilometragem atual do veículo, impedindo redução maliciosa do histórico.
 * - IDOR & Multi-tenant Authorization: Verifica posse e status da oficina com requireApprovedAction.
 * - Information Leakage: Sanitiza erros de procedures internas do PostgreSQL.
 *
 * @param veiculoId - UUID do veículo em manutenção.
 * @param formData - FormData com dados do serviço (tipo, km, custo, observação e insumos).
 * @throws {Error} Se os dados forem inconsistentes, a oficina não estiver aprovada ou o odômetro for menor que o atual.
 * @returns {Promise<never>} Redireciona para a página do prontuário do veículo após cadastro com sucesso.
 */
export async function criarOrdemServico(
  veiculoId: string,
  formData: FormData
): Promise<never> {
  // 1. Autorização estrita e conferência de oficina homologada
  const session = await requireApprovedAction(["admin", "mecanico"]);

  // 2. Validação formal do UUID do veículo
  if (!UUID_REGEX.test(veiculoId)) {
    throw new Error("Identificador de veículo inválido.");
  }

  // 3. Validação dos dados primários da ordem de serviço via Zod
  const parsed = serviceSchema.safeParse({
    tipoServico: formData.get("tipoServico"),
    kmNoServico: formData.get("kmNoServico"),
    custo: String(formData.get("custo") ?? "").trim() ? formData.get("custo") : null,
    observacao: formData.get("observacao") ?? "",
  });

  if (!parsed.success) {
    throw new Error("Dados da manutenção inconsistentes. Verifique os campos preenchidos.");
  }

  // 4. Verifica se o veículo pertence à oficina conectada e obtém o odômetro atual
  const { data: veiculo } = await supabaseAdmin
    .from("veiculos")
    .select("id, km_atual")
    .eq("id", veiculoId)
    .eq("loja_id", session.user.lojaId)
    .maybeSingle();

  if (!veiculo) {
    throw new Error("Veículo não encontrado ou não pertence a esta oficina.");
  }

  // 5. MITIGAÇÃO CONTRA ADULTERAÇÃO DE QUILOMETRAGEM (Odômetro não pode regredir)
  if (parsed.data.kmNoServico < veiculo.km_atual) {
    throw new Error(
      `A quilometragem informada (${parsed.data.kmNoServico} km) não pode ser inferior à quilometragem atual registrada (${veiculo.km_atual} km).`
    );
  }

  // 6. Filtra as peças permitidas pertencentes exclusivamente à loja logada
  const { data: materiaisDaLoja } = await supabaseAdmin
    .from("materiais")
    .select("id")
    .eq("loja_id", session.user.lojaId);

  const allowedIds = new Set((materiaisDaLoja ?? []).map((m) => m.id));

  // 7. MITIGAÇÃO DE RPC: Sanitização, deduplicação e limite estrito de peças
  const pecasMap = new Map<string, number>();

  for (const id of allowedIds) {
    const marcado = formData.get(`peca_${id}`);
    if (marcado) {
      const qtdRaw = formData.get(`qtd_${id}`);
      const qtd = Number(qtdRaw ?? 0);
      if (Number.isInteger(qtd) && qtd > 0 && qtd <= 10_000) {
        pecasMap.set(id, qtd);
      }
    }
  }

  // Limita a no máximo 50 itens distintos por ordem de serviço para conter abusos de payload
  if (pecasMap.size > 50) {
    throw new Error("Limite máximo de 50 peças distintas por ordem de serviço excedido.");
  }

  const pecas: ItemPecaUtilizada[] = Array.from(pecasMap.entries()).map(
    ([material_id, quantidade]) => ({
      material_id,
      quantidade,
    })
  );

  // 8. Executa procedure armazenada do PostgreSQL com parâmetros estritamente tipados
  const { data: osId, error } = await supabaseAdmin.rpc("criar_ordem_servico", {
    p_veiculo_id: veiculoId,
    p_tipo_servico: parsed.data.tipoServico,
    p_km_no_servico: parsed.data.kmNoServico,
    p_mecanico_usuario_id: session.user.id,
    p_custo: parsed.data.custo,
    p_observacao: parsed.data.observacao || null,
    p_pecas: pecas,
    p_loja_id: session.user.lojaId,
  });

  if (error || !osId) {
    console.error("ERRO AO REGISTRAR ORDEM DE SERVIÇO VIA RPC:", error);
    throw new Error("Não foi possível registrar a manutenção no momento. Tente novamente.");
  }

  redirect(`/loja/veiculo/${veiculoId}`);
}

/**
 * Atualiza dados cadastrais de uma ordem de serviço previamente registrada.
 *
 * MITIGAÇÃO:
 * - IDOR: Garante que a OS e o veículo pertençam à mesma oficina antes de atualizar.
 * - Imutabilidade de Odômetro: Impede alteração retroativa de quilometragem e peças nesta ação.
 *
 * @param ordemServicoId - UUID da ordem de serviço.
 * @param veiculoId - UUID do veículo associado.
 * @param formData - FormData contendo tipo de serviço, custo e observações complementares.
 * @throws {Error} Se a OS não pertencer à loja do usuário ou os dados forem inválidos.
 * @returns {Promise<never>} Redireciona de volta para o prontuário do veículo.
 */
export async function editarOrdemServico(
  ordemServicoId: string,
  veiculoId: string,
  formData: FormData
): Promise<never> {
  const session = await requireApprovedAction(["admin", "mecanico"]);

  if (!UUID_REGEX.test(ordemServicoId) || !UUID_REGEX.test(veiculoId)) {
    throw new Error("Identificadores inválidos.");
  }

  const parsed = serviceSchema.safeParse({
    tipoServico: formData.get("tipoServico"),
    kmNoServico: 0,
    custo: String(formData.get("custo") ?? "").trim() ? formData.get("custo") : null,
    observacao: formData.get("observacao") ?? "",
  });

  if (!parsed.success) {
    throw new Error("Dados da ordem de serviço inválidos.");
  }

  // Verifica existência e autorização multitenant cruzada
  const { data: os } = await supabaseAdmin
    .from("ordens_servico")
    .select("id, veiculo_id, veiculos!inner(id, loja_id)")
    .eq("id", ordemServicoId)
    .eq("veiculo_id", veiculoId)
    .eq("veiculos.loja_id", session.user.lojaId)
    .maybeSingle();

  if (!os) {
    throw new Error("Ordem de serviço não encontrada nesta oficina.");
  }

  const { error } = await supabaseAdmin
    .from("ordens_servico")
    .update({
      tipo_servico: parsed.data.tipoServico,
      custo: parsed.data.custo,
      observacao: parsed.data.observacao || null,
    })
    .eq("id", ordemServicoId)
    .eq("veiculo_id", veiculoId);

  if (error) {
    console.error("ERRO AO ATUALIZAR OS:", error);
    throw new Error("Não foi possível salvar as alterações da ordem de serviço.");
  }

  redirect(`/loja/veiculo/${veiculoId}`);
}


