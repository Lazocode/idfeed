"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/security";
import { serviceSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function criarOrdemServico(veiculoId: string, formData: FormData) {
  const session = await requireRole(["admin", "mecanico"]);
  const parsed = serviceSchema.safeParse({ tipoServico: formData.get("tipoServico"), kmNoServico: formData.get("kmNoServico"), custo: String(formData.get("custo") ?? "").trim() ? formData.get("custo") : null, observacao: formData.get("observacao") ?? "" });
  if (!parsed.success) throw new Error("Confira os dados da manutenção.");
  const { data: veiculo } = await supabaseAdmin.from("veiculos").select("id").eq("id", veiculoId).eq("loja_id", session.user.lojaId).maybeSingle();
  if (!veiculo) throw new Error("Veículo não encontrado nesta loja.");

  const { data: materiaisDaLoja } = await supabaseAdmin.from("materiais").select("id").eq("loja_id", session.user.lojaId);
  const allowed = new Set((materiaisDaLoja ?? []).map((m) => m.id));
  const pecas = Array.from(allowed).map((id) => {
    const marcado = formData.get(`peca_${id}`);
    const qtd = Number(formData.get(`qtd_${id}`) ?? 0);
    return marcado && Number.isInteger(qtd) && qtd > 0 && qtd <= 100000 ? { material_id: id, quantidade: qtd } : null;
  }).filter((x): x is { material_id: string; quantidade: number } => x !== null);

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

export async function editarOrdemServico(ordemServicoId: string, veiculoId: string, formData: FormData) {
  const session = await requireRole(["admin", "mecanico"]);
  const parsed = serviceSchema.safeParse({ tipoServico: formData.get("tipoServico"), kmNoServico: 0, custo: String(formData.get("custo") ?? "").trim() ? formData.get("custo") : null, observacao: formData.get("observacao") ?? "" });
  if (!parsed.success) throw new Error("Dados inválidos.");
  const { data: os } = await supabaseAdmin.from("ordens_servico").select("id, veiculo_id, veiculos!inner(id, loja_id)").eq("id", ordemServicoId).eq("veiculo_id", veiculoId).eq("veiculos.loja_id", session.user.lojaId).maybeSingle();
  if (!os) throw new Error("Ordem de serviço não encontrada nesta loja.");
  const { error } = await supabaseAdmin.from("ordens_servico").update({ tipo_servico: parsed.data.tipoServico, custo: parsed.data.custo, observacao: parsed.data.observacao || null }).eq("id", ordemServicoId).eq("veiculo_id", veiculoId);
  if (error) throw new Error("Não foi possível editar a ordem de serviço.");
  redirect(`/loja/veiculo/${veiculoId}`);
}
