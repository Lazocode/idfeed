"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/security";
import { materialSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function criarMaterial(formData: FormData) {
  const session = await requireRole(["admin", "mecanico", "atendente"]);
  const parsed = materialSchema.safeParse({ nome: formData.get("nome"), sku: formData.get("sku"), localizacao: formData.get("localizacao") ?? "", quantidadeAtual: formData.get("quantidadeAtual") ?? 0, quantidadeMinima: formData.get("quantidadeMinima") ?? 5 });
  if (!parsed.success) throw new Error("Confira os dados do material.");
  const { nome, sku, localizacao, quantidadeAtual, quantidadeMinima } = parsed.data;
  const normalizedSku = sku.toUpperCase();
  const { data: existente } = await supabaseAdmin.from("materiais").select("id").eq("loja_id", session.user.lojaId).eq("sku", normalizedSku).maybeSingle();
  if (existente) throw new Error("Já existe um material com esse SKU nesta loja.");
  const { data: material, error } = await supabaseAdmin.from("materiais").insert({ loja_id: session.user.lojaId, nome, sku: normalizedSku, localizacao: localizacao || null, quantidade_atual: quantidadeAtual, quantidade_minima: quantidadeMinima }).select().single();
  if (error || !material) throw new Error("Não foi possível cadastrar o material.");
  redirect(`/loja/material/${material.id}`);
}
