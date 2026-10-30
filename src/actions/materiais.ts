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
import { requireApprovedAction } from "@/lib/security";
import { materialSchema } from "@/lib/validation";

/**
 * Cadastra uma nova peça ou insumo no estoque da oficina mecânica com validação defensiva.
 *
 * MITIGAÇÃO:
 * - Multi-tenant Isolation: Exige oficina homologada (requireApprovedAction) e isola SKU por `loja_id`.
 * - Information Disclosure: Esconde detalhes internos do banco de dados na resposta de erro.
 *
 * @param formData - Dados do material (nome, SKU, localização, quantidade atual e cota mínima).
 * @throws {Error} Se a validação dos dados falhar ou se o SKU já existir para a mesma oficina.
 * @returns {Promise<never>} Redireciona para a página de detalhes do material recém-criado.
 */
export async function criarMaterial(formData: FormData): Promise<never> {
  // 1. Exige perfil operacional com loja homologada
  const session = await requireApprovedAction(["admin", "mecanico", "atendente"]);

  // 2. Validação estrita via Zod
  const parsed = materialSchema.safeParse({
    nome: formData.get("nome"),
    sku: formData.get("sku"),
    localizacao: formData.get("localizacao") ?? "",
    quantidadeAtual: formData.get("quantidadeAtual") ?? 0,
    quantidadeMinima: formData.get("quantidadeMinima") ?? 5,
  });

  if (!parsed.success) {
    throw new Error("Confira os dados do material. Campos obrigatórios incompletos.");
  }

  const {
    nome,
    sku,
    localizacao,
    quantidadeAtual,
    quantidadeMinima,
  } = parsed.data;

  const normalizedSku = sku.toUpperCase();

  // 3. Verifica se já existe uma peça com o mesmo SKU nesta oficina (escopo multi-tenant estrito)
  const { data: existente } = await supabaseAdmin
    .from("materiais")
    .select("id")
    .eq("loja_id", session.user.lojaId)
    .eq("sku", normalizedSku)
    .maybeSingle();

  if (existente) {
    throw new Error("Já existe um material com esse SKU nesta oficina.");
  }

  // 4. Insere o novo material no banco com isolamento por loja_id
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
    console.error("ERRO AO CADASTRAR MATERIAL:", error);
    throw new Error("Não foi possível cadastrar o material no momento.");
  }

  // Redireciona para a tela do material cadastrado
  redirect(`/loja/material/${material.id}`);
}


