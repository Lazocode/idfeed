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
import { requireRole } from "@/lib/security";
import { serviceSchema } from "@/lib/validation";

/**
 * Estrutura de insumos/peças utilizados em uma ordem de manutenção veicular.
 */
export interface ItemPecaUtilizada {
  material_id: string;
  quantidade: number;
}

/**
 * Registra uma nova ordem de serviço para um veículo, efetuando baixa automática no estoque das peças selecionadas.
 *
 * @param veiculoId - UUID do veículo em manutenção.
 * @param formData - FormData com dados do serviço (tipo, km, custo, observação e checkboxes/quantidades de peças).
 * @throws {Error} Se os dados forem inválidos ou o procedimento no banco de dados falhar.
 * @returns {Promise<void>}
 */
export async function criarOrdemServico(
  veiculoId: string,
  formData: FormData
): Promise<void> {
  const session = await requireRole(["admin", "mecanico"]);

  // Validação dos dados primários da ordem de serviço
  const parsed = serviceSchema.safeParse({
    tipoServico: formData.get("tipoServico"),
    kmNoServico: formData.get("kmNoServico"),
    custo: String(formData.get("custo") ?? "").trim() ? formData.get("custo") : null,
    observacao: formData.get("observacao") ?? "",
  });

  if (!parsed.success) {
    throw new Error("Confira os dados da manutenção.");
  }

  // Verifica se o veículo pertence à oficina conectada
  const { data: veiculo } = await supabaseAdmin
    .from("veiculos")
    .select("id")
    .eq("id", veiculoId)
    .eq("loja_id", session.user.lojaId)
    .maybeSingle();

  if (!veiculo) {
    throw new Error("Veículo não encontrado nesta loja.");
  }

  // Filtra as peças permitidas pertencentes exclusivamente à loja logada
  const { data: materiaisDaLoja } = await supabaseAdmin
    .from("materiais")
    .select("id")
    .eq("loja_id", session.user.lojaId);

  const allowed = new Set((materiaisDaLoja ?? []).map((m) => m.id));

  // Mapeia os inputs de peças selecionadas no formulário
  const pecas: ItemPecaUtilizada[] = Array.from(allowed)
    .map((id) => {
      const marcado = formData.get(`peca_${id}`);
      const qtd = Number(formData.get(`qtd_${id}`) ?? 0);
      return marcado && Number.isInteger(qtd) && qtd > 0 && qtd <= 100000
        ? { material_id: id, quantidade: qtd }
        : null;
    })
    .filter((x): x is ItemPecaUtilizada => x !== null);

  // Executa procedure armazenada do PostgreSQL para criação atômica da OS e baixa das peças
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
    console.error("ERRO AO REGISTRAR MANUTENÇÃO:", error);
    throw new Error(
      error?.message || "Não foi possível registrar manutenção."
    );
  }
}

/**
 * Atualiza dados cadastrais de uma ordem de serviço previamente registrada (exceto quilometragem e peças retroativas).
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
  const session = await requireRole(["admin", "mecanico"]);

  const parsed = serviceSchema.safeParse({
    tipoServico: formData.get("tipoServico"),
    kmNoServico: 0,
    custo: String(formData.get("custo") ?? "").trim() ? formData.get("custo") : null,
    observacao: formData.get("observacao") ?? "",
  });

  if (!parsed.success) {
    throw new Error("Dados inválidos.");
  }

  // Verifica existência e autorização multitenant
  const { data: os } = await supabaseAdmin
    .from("ordens_servico")
    .select("id, veiculo_id, veiculos!inner(id, loja_id)")
    .eq("id", ordemServicoId)
    .eq("veiculo_id", veiculoId)
    .eq("veiculos.loja_id", session.user.lojaId)
    .maybeSingle();

  if (!os) {
    throw new Error("Ordem de serviço não encontrada nesta loja.");
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
    throw new Error("Não foi possível editar a ordem de serviço.");
  }

  redirect(`/loja/veiculo/${veiculoId}`);
}

