"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/security";
import { vehicleSchema } from "@/lib/validation";
import { normPlaca } from "@/lib/utils";
import { redirect } from "next/navigation";
import crypto from "node:crypto";

export async function criarVeiculo(formData: FormData) {
  const session = await requireRole(["admin", "mecanico", "atendente"]);

  const parsed = vehicleSchema.safeParse({
    placa: formData.get("placa"),
    modelo: formData.get("modelo"),
    proprietarioNome: formData.get("proprietarioNome"),
    proprietarioCpf: formData.get("proprietarioCpf"),
    proprietarioContato: formData.get("proprietarioContato") ?? "",
    kmAtual: formData.get("kmAtual") ?? 0,
  });

  if (!parsed.success) {
    throw new Error("Confira os dados do veículo.");
  }

  const {
    placa: placaRaw,
    modelo,
    proprietarioNome,
    proprietarioCpf,
    proprietarioContato,
    kmAtual,
  } = parsed.data;

  const placa = normPlaca(placaRaw);

  const cpfSecret = process.env.CPF_HASH_SECRET;

  if (!cpfSecret) {
    throw new Error("Configuração de segurança do CPF não encontrada.");
  }

  const cpfHash = crypto
    .createHmac("sha256", cpfSecret)
    .update(proprietarioCpf)
    .digest("hex");

  const { data: existente } = await supabaseAdmin
    .from("veiculos")
    .select("id")
    .eq("placa", placa)
    .maybeSingle();

  if (existente) {
    throw new Error("Já existe um veículo cadastrado com essa placa.");
  }

  const { data: veiculo, error } = await supabaseAdmin
    .from("veiculos")
    .insert({
      loja_id: session.user.lojaId,
      placa,
      public_token: crypto.randomBytes(24).toString("hex"),
      modelo,
      proprietario_nome: proprietarioNome,
      proprietario_cpf_hash: cpfHash,
      proprietario_contato: proprietarioContato || null,
      km_atual: kmAtual,
      km_proxima_revisao: kmAtual + 5000,
      nota_proxima_revisao: "Definir próxima revisão",
    })
    .select()
    .single();

  if (error || !veiculo) {
  console.error("ERRO AO CADASTRAR VEÍCULO:", error);
  throw new Error(
    error?.message || "Não foi possível cadastrar o veículo."
  );
}

  redirect(`/loja/veiculo/${veiculo.id}`);
}

export async function atualizarProximaRevisao(veiculoId: string, formData: FormData) {
  const session = await requireRole(["admin", "mecanico"]);
  const km = formData.get("kmProximaRevisao");
  const kmProximaRevisao = km === null || String(km).trim() === "" ? null : Number(km);
  if (kmProximaRevisao !== null && (!Number.isInteger(kmProximaRevisao) || kmProximaRevisao < 0 || kmProximaRevisao > 10_000_000)) throw new Error("Quilometragem inválida.");
  const notaProximaRevisao = String(formData.get("notaProximaRevisao") ?? "").trim();
  if (notaProximaRevisao.length > 500) throw new Error("Nota muito longa.");
  await supabaseAdmin.from("veiculos").update({ km_proxima_revisao: kmProximaRevisao, nota_proxima_revisao: notaProximaRevisao || null }).eq("id", veiculoId).eq("loja_id", session.user.lojaId);
  redirect(`/loja/veiculo/${veiculoId}`);
}
