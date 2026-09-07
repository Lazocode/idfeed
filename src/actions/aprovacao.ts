"use server";

import { requireRole } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function aprovarOficina(lojaId: string) {
  await requireRole(["admin"]);

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

  const { data: documento, error: documentoError } =
    await supabaseAdmin
      .from("documentos_oficina")
      .select("id, status")
      .eq("loja_id", lojaId)
      .eq("status", "pendente")
      .order("enviado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (documentoError) {
    console.error(
      "ERRO AO BUSCAR DOCUMENTO:",
      documentoError
    );

    throw new Error("Não foi possível verificar o documento.");
  }

  if (!documento) {
    throw new Error(
      "A oficina ainda não possui um documento pendente."
    );
  }

  const agora = new Date().toISOString();

  const { error: lojaUpdateError } = await supabaseAdmin
    .from("lojas")
    .update({
      status: "aprovada",
    })
    .eq("id", lojaId)
    .eq("status", "pendente");

  if (lojaUpdateError) {
    console.error(
      "ERRO AO APROVAR OFICINA:",
      lojaUpdateError
    );

    throw new Error("Não foi possível aprovar a oficina.");
  }

  const { error: documentoUpdateError } =
    await supabaseAdmin
      .from("documentos_oficina")
      .update({
        status: "aprovado",
        analisado_em: agora,
        observacao: "Documento aprovado.",
      })
      .eq("id", documento.id)
      .eq("status", "pendente");

  if (documentoUpdateError) {
    console.error(
      "ERRO AO ATUALIZAR DOCUMENTO:",
      documentoUpdateError
    );

    // Tenta desfazer a aprovação da oficina
    await supabaseAdmin
      .from("lojas")
      .update({
        status: "pendente",
      })
      .eq("id", lojaId);

    throw new Error(
      "Não foi possível finalizar a aprovação."
    );
  }

  revalidatePath("/admin/aprovacoes");
  revalidatePath(`/admin/aprovacoes/${lojaId}`);
}

export async function rejeitarOficina(
  lojaId: string,
  observacao: string
) {
  await requireRole(["admin"]);

  const motivo = observacao.trim();

  if (!motivo) {
    throw new Error("Informe o motivo da rejeição.");
  }

  if (motivo.length > 500) {
    throw new Error(
      "O motivo da rejeição deve ter no máximo 500 caracteres."
    );
  }

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

  const { data: documento, error: documentoError } =
    await supabaseAdmin
      .from("documentos_oficina")
      .select("id, status")
      .eq("loja_id", lojaId)
      .eq("status", "pendente")
      .order("enviado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (documentoError) {
    console.error(
      "ERRO AO BUSCAR DOCUMENTO:",
      documentoError
    );

    throw new Error(
      "Não foi possível verificar o documento."
    );
  }

  if (!documento) {
    throw new Error(
      "A oficina ainda não possui um documento pendente."
    );
  }

  const agora = new Date().toISOString();

  const { error: lojaUpdateError } = await supabaseAdmin
    .from("lojas")
    .update({
      status: "rejeitada",
    })
    .eq("id", lojaId)
    .eq("status", "pendente");

  if (lojaUpdateError) {
    console.error(
      "ERRO AO REJEITAR OFICINA:",
      lojaUpdateError
    );

    throw new Error(
      "Não foi possível rejeitar a oficina."
    );
  }

  const { error: documentoUpdateError } =
    await supabaseAdmin
      .from("documentos_oficina")
      .update({
        status: "rejeitado",
        analisado_em: agora,
        observacao: motivo,
      })
      .eq("id", documento.id)
      .eq("status", "pendente");

  if (documentoUpdateError) {
    console.error(
      "ERRO AO ATUALIZAR DOCUMENTO:",
      documentoUpdateError
    );

    // Tenta desfazer a rejeição da oficina
    await supabaseAdmin
      .from("lojas")
      .update({
        status: "pendente",
      })
      .eq("id", lojaId);

    throw new Error(
      "Não foi possível finalizar a rejeição."
    );
  }

  revalidatePath("/admin/aprovacoes");
  revalidatePath(`/admin/aprovacoes/${lojaId}`);
}