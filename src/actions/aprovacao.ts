/**
 * @file aprovacao.ts
 * @description Server Actions para moderação e auditoria cadastral de oficinas credenciadas.
 * Permite que administradores aprovem o credenciamento de oficinas ou rejeitem com justificativa formal.
 * @module actions/aprovacao
 * @recommendedPath src/actions/aprovacao.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import { revalidatePath } from "next/cache";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/security";

/**
 * Homologa e aprova o credenciamento de uma oficina na plataforma IDfeed.
 * Valida os privilégios de superadministrador, confere o status pendente e atualiza
 * tanto o cadastro da loja quanto o último documento anexado para "aprovado".
 *
 * @param lojaId - Identificador único da oficina a ser homologada (UUID).
 * @throws {Error} Se o solicitante não for admin, a oficina não existir ou não estiver pendente.
 * @returns {Promise<void>}
 */
export async function aprovarOficina(lojaId: string): Promise<void> {
  // Exige privilégios estritos de superadministrador geral
  await requireAdmin();

  // Busca a oficina e verifica seu status atual
  const { data: loja, error: lojaError } = await supabaseAdmin
    .from("lojas")
    .select("id, status")
    .eq("id", lojaId)
    .single();

  if (lojaError || !loja) {
    throw new Error("Oficina não encontrada.");
  }

  if (loja.status !== "pendente") {
    throw new Error("Esta oficina não está pendente.");
  }

  // Busca o último documento pendente enviado pela oficina
  const { data: documento, error: documentoError } = await supabaseAdmin
    .from("documentos_oficina")
    .select("id, status")
    .eq("loja_id", lojaId)
    .eq("status", "pendente")
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (documentoError) {
    console.error("ERRO AO BUSCAR DOCUMENTO:", documentoError);
    throw new Error("Não foi possível verificar o documento.");
  }

  if (!documento) {
    throw new Error("A oficina ainda não possui um documento pendente.");
  }

  const agora = new Date().toISOString();

  // Transiciona o status da oficina para 'aprovada'
  const { error: lojaUpdateError } = await supabaseAdmin
    .from("lojas")
    .update({
      status: "aprovada",
    })
    .eq("id", lojaId)
    .eq("status", "pendente");

  if (lojaUpdateError) {
    console.error("ERRO AO APROVAR OFICINA:", lojaUpdateError);
    throw new Error("Não foi possível aprovar a oficina.");
  }

  // Atualiza o documento para 'aprovado'
  const { error: documentoUpdateError } = await supabaseAdmin
    .from("documentos_oficina")
    .update({
      status: "aprovado",
      analisado_em: agora,
      observacao: "Documento aprovado.",
    })
    .eq("id", documento.id)
    .eq("status", "pendente");

  if (documentoUpdateError) {
    console.error("ERRO AO ATUALIZAR DOCUMENTO:", documentoUpdateError);

    // Rollback de segurança: restaura a oficina para o status pendente
    await supabaseAdmin
      .from("lojas")
      .update({
        status: "pendente",
      })
      .eq("id", lojaId);

    throw new Error("Não foi possível finalizar a aprovação.");
  }

  // Revalida as páginas afetadas pelo novo status
  revalidatePath("/admin/aprovacoes");
  revalidatePath(`/admin/aprovacoes/${lojaId}`);
}

/**
 * Rejeita o credenciamento de uma oficina com registro de justificativa.
 * Valida permissões de administrador, armazena a observação e transiciona
 * os registros da oficina e do documento comprobatório para 'rejeitado'.
 *
 * @param lojaId - Identificador único da oficina (UUID).
 * @param observacao - Justificativa detalhada para orientar a oficina na regularização.
 * @throws {Error} Se o usuário não for admin, a justificativa for vazia ou exceder 500 caracteres.
 * @returns {Promise<void>}
 */
export async function rejeitarOficina(
  lojaId: string,
  observacao: string
): Promise<void> {
  // Exige permissão de administrador
  await requireAdmin();

  const motivo = observacao.trim();

  if (!motivo) {
    throw new Error("Informe o motivo da rejeição.");
  }

  if (motivo.length > 500) {
    throw new Error("O motivo da rejeição deve ter no máximo 500 caracteres.");
  }

  // Confere a existência e o status atual da oficina
  const { data: loja, error: lojaError } = await supabaseAdmin
    .from("lojas")
    .select("id, status")
    .eq("id", lojaId)
    .single();

  if (lojaError || !loja) {
    throw new Error("Oficina não encontrada.");
  }

  if (loja.status !== "pendente") {
    throw new Error("Esta oficina não está pendente.");
  }

  // Localiza o documento pendente associado
  const { data: documento, error: documentoError } = await supabaseAdmin
    .from("documentos_oficina")
    .select("id, status")
    .eq("loja_id", lojaId)
    .eq("status", "pendente")
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (documentoError) {
    console.error("ERRO AO BUSCAR DOCUMENTO:", documentoError);
    throw new Error("Não foi possível verificar o documento.");
  }

  if (!documento) {
    throw new Error("A oficina ainda não possui um documento pendente.");
  }

  const agora = new Date().toISOString();

  // Transiciona a loja para rejeitada
  const { error: lojaUpdateError } = await supabaseAdmin
    .from("lojas")
    .update({
      status: "rejeitada",
    })
    .eq("id", lojaId)
    .eq("status", "pendente");

  if (lojaUpdateError) {
    console.error("ERRO AO REJEITAR OFICINA:", lojaUpdateError);
    throw new Error("Não foi possível rejeitar a oficina.");
  }

  // Atualiza o documento registrando o parecer e a observação
  const { error: documentoUpdateError } = await supabaseAdmin
    .from("documentos_oficina")
    .update({
      status: "rejeitado",
      analisado_em: agora,
      observacao: motivo,
    })
    .eq("id", documento.id)
    .eq("status", "pendente");

  if (documentoUpdateError) {
    console.error("ERRO AO ATUALIZAR DOCUMENTO:", documentoUpdateError);

    // Rollback defensivo: reverte status da loja para pendente
    await supabaseAdmin
      .from("lojas")
      .update({
        status: "pendente",
      })
      .eq("id", lojaId);

    throw new Error("Não foi possível finalizar a rejeição.");
  }

  // Revalida caminhos administrativos
  revalidatePath("/admin/aprovacoes");
  revalidatePath(`/admin/aprovacoes/${lojaId}`);
}
