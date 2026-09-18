/**
 * @file movimentacoes.ts
 * @description Server Actions para controle de entradas, saídas e ajustes de saldo no estoque de peças.
 * Executa a procedure transacional `registrar_movimentacao` no banco e mantém a auditoria dos lançamentos.
 * @module actions/movimentacoes
 * @recommendedPath src/actions/movimentacoes.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import { redirect } from "next/navigation";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/security";
import { movementSchema } from "@/lib/validation";

/**
 * Registra uma nova movimentação de estoque (entrada, saída ou ajuste) de forma atômica.
 *
 * @param materialId - UUID do material a ser movimentado.
 * @param formData - Dados contendo o tipo ('entrada' | 'saida' | 'ajuste'), quantidade e observação.
 * @throws {Error} Se os dados forem inválidos, a quantidade for nula/negativa ou o material não pertencer à loja.
 * @returns {Promise<never>} Redireciona para a página do material com o saldo atualizado.
 */
export async function registrarMovimentacao(
  materialId: string,
  formData: FormData
): Promise<never> {
  // Exige papel com permissão mecânica ou administrativa
  const session = await requireRole(["admin", "mecanico"]);

  // Validação dos dados informados
  const parsed = movementSchema.safeParse({
    tipo: formData.get("tipo"),
    quantidade: formData.get("quantidade"),
    observacao: formData.get("observacao") ?? "",
  });

  if (!parsed.success) {
    throw new Error("Dados de movimentação inválidos.");
  }

  // Verifica se o material pertence à oficina do usuário conectado
  const { data: material } = await supabaseAdmin
    .from("materiais")
    .select("id")
    .eq("id", materialId)
    .eq("loja_id", session.user.lojaId)
    .maybeSingle();

  if (!material) {
    throw new Error("Material não encontrado nesta loja.");
  }

  const { tipo, quantidade, observacao } = parsed.data;

  if ((tipo === "entrada" || tipo === "saida") && quantidade <= 0) {
    throw new Error("Informe uma quantidade válida.");
  }

  // Define o delta algébrico para a rotina do banco (+ para entrada, - para saída)
  const delta = tipo === "entrada" ? quantidade : tipo === "saida" ? -quantidade : 0;

  // Executa procedure armazenada do PostgreSQL garantindo consistência atômica
  const { error } = await supabaseAdmin.rpc("registrar_movimentacao", {
    p_material_id: materialId,
    p_tipo: tipo,
    p_delta: delta,
    p_responsavel_usuario_id: session.user.id,
    p_observacao: observacao || null,
    p_loja_id: session.user.lojaId,
  });

  if (error) {
    console.error("ERRO AO REGISTRAR MOVIMENTAÇÃO:", error);
    throw new Error("Não foi possível registrar a movimentação.");
  }

  // Redireciona para a página do material
  redirect(`/loja/material/${materialId}`);
}

/**
 * Atualiza a observação descritiva de uma movimentação histórica de estoque.
 *
 * @param movimentacaoId - UUID do registro de movimentação de estoque.
 * @param materialId - UUID do material associado.
 * @param formData - FormData contendo a nova observação.
 * @throws {Error} Se a observação ultrapassar 2000 caracteres ou o registro não for encontrado.
 * @returns {Promise<never>} Redireciona para a tela do material.
 */
export async function editarMovimentacao(
  movimentacaoId: string,
  materialId: string,
  formData: FormData
): Promise<never> {
  const session = await requireRole(["admin", "mecanico"]);

  const observacao = String(formData.get("observacao") ?? "").trim();

  if (observacao.length > 2000) {
    throw new Error("Observação muito longa.");
  }

  // Garante que o registro pertence à oficina atual
  const { data: movimento } = await supabaseAdmin
    .from("movimentacoes_estoque")
    .select("id, material_id, materiais!inner(id, loja_id)")
    .eq("id", movimentacaoId)
    .eq("material_id", materialId)
    .eq("materiais.loja_id", session.user.lojaId)
    .maybeSingle();

  if (!movimento) {
    throw new Error("Movimentação não encontrada nesta loja.");
  }

  const { error } = await supabaseAdmin
    .from("movimentacoes_estoque")
    .update({ observacao: observacao || null })
    .eq("id", movimentacaoId)
    .eq("material_id", materialId);

  if (error) {
    throw new Error("Não foi possível editar a movimentação.");
  }

  redirect(`/loja/material/${materialId}`);
}

