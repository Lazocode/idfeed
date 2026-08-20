"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/security";
import { movementSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function registrarMovimentacao(materialId: string, formData: FormData) {
  const session = await requireRole(["admin", "mecanico"]);
  const parsed = movementSchema.safeParse({ tipo: formData.get("tipo"), quantidade: formData.get("quantidade"), observacao: formData.get("observacao") ?? "" });
  if (!parsed.success) throw new Error("Dados de movimentação inválidos.");
  const { data: material } = await supabaseAdmin.from("materiais").select("id").eq("id", materialId).eq("loja_id", session.user.lojaId).maybeSingle();
  if (!material) throw new Error("Material não encontrado nesta loja.");
  const { tipo, quantidade, observacao } = parsed.data;
  if ((tipo === "entrada" || tipo === "saida") && quantidade <= 0) throw new Error("Informe uma quantidade válida.");
  const delta = tipo === "entrada" ? quantidade : tipo === "saida" ? -quantidade : 0;
  const { error } = await supabaseAdmin.rpc("registrar_movimentacao", { p_material_id: materialId, p_tipo: tipo, p_delta: delta, p_responsavel_usuario_id: session.user.id, p_observacao: observacao || null, p_loja_id: session.user.lojaId });
  if (error) throw new Error("Não foi possível registrar a movimentação.");
  redirect(`/loja/material/${materialId}`);
}

export async function editarMovimentacao(movimentacaoId: string, materialId: string, formData: FormData) {
  const session = await requireRole(["admin", "mecanico"]);
  const observacao = String(formData.get("observacao") ?? "").trim();
  if (observacao.length > 2000) throw new Error("Observação muito longa.");
  const { data: movimento } = await supabaseAdmin.from("movimentacoes_estoque").select("id, material_id, materiais!inner(id, loja_id)").eq("id", movimentacaoId).eq("material_id", materialId).eq("materiais.loja_id", session.user.lojaId).maybeSingle();
  if (!movimento) throw new Error("Movimentação não encontrada nesta loja.");
  const { error } = await supabaseAdmin.from("movimentacoes_estoque").update({ observacao: observacao || null }).eq("id", movimentacaoId).eq("material_id", materialId);
  if (error) throw new Error("Não foi possível editar a movimentação.");
  redirect(`/loja/material/${materialId}`);
}
