/**
 * @file materiais.ts
 * @description Server Actions para gerenciamento do catálogo de materiais e peças do estoque da oficina.
 * Inclui validação de SKU único por loja, localização física na oficina e cota de estoque mínimo.
 * @module actions/materiais
 * @recommendedPath src/actions/materiais.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import { redirect } from "next/navigation";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/security";
import { materialSchema } from "@/lib/validation";

/**
 * Cadastra uma nova peça ou insumo no estoque da oficina mecânica.
 *
 * @param formData - Dados do material (nome, SKU, localização, quantidade atual e cota mínima).
 * @throws {Error} Se a validação dos dados falhar ou se o SKU já existir para a mesma oficina.
 * @returns {Promise<never>} Redireciona para a página de detalhes do material recém-criado.
 */
export async function criarMaterial(formData: FormData): Promise<never> {
  // Exige perfil operacional com permissão de manipulação de estoque
  const session = await requireRole(["admin", "mecanico", "atendente"]);

  // Validação estrita via Zod
  const parsed = materialSchema.safeParse({
    nome: formData.get("nome"),
    sku: formData.get("sku"),
    localizacao: formData.get("localizacao") ?? "",
    quantidadeAtual: formData.get("quantidadeAtual") ?? 0,
    quantidadeMinima: formData.get("quantidadeMinima") ?? 5,
  });

  if (!parsed.success) {
    throw new Error("Confira os dados do material.");
  }

  const {
    nome,
    sku,
    localizacao,
    quantidadeAtual,
    quantidadeMinima,
  } = parsed.data;

  const normalizedSku = sku.toUpperCase();

  // Verifica se já existe uma peça com o mesmo SKU nesta oficina
  const { data: existente } = await supabaseAdmin
    .from("materiais")
    .select("id")
    .eq("loja_id", session.user.lojaId)
    .eq("sku", normalizedSku)
    .maybeSingle();

  if (existente) {
    throw new Error("Já existe um material com esse SKU nesta loja.");
  }

  // Insere o novo material no banco
  const { data: material, error } = await supabaseAdmin
    .from("materiais")
    .insert({
      loja_id: session.user.lojaId,
      nome,
      sku: normalizedSku,
      localizacao: localizacao || null,
      quantidade_atual: quantidadeAtual,
      quantidade_minima: quantidadeMinima,
    })
    .select()
    .single();

  if (error || !material) {
    throw new Error("Não foi possível cadastrar o material.");
  }

  // Redireciona para a tela do material cadastrado
  redirect(`/loja/material/${material.id}`);
}

