"use server";

import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { normPlaca } from "@/lib/utils";

export async function ConsultarVeiculo(
  placaInput: string,
  cpfInput: string
) {
  const placa = normPlaca(placaInput);

  const cpf = cpfInput.replace(/\D/g, "");

  if (!/^[A-Z0-9]{7}$/.test(placa)) {
    return { erro: "Placa inválida." };
  }

  if (!/^\d{11}$/.test(cpf)) {
    return { erro: "CPF inválido." };
  }

  const cpfSecret = process.env.CPF_HASH_SECRET;

  if (!cpfSecret) {
    console.error("CPF_HASH_SECRET não configurado.");
    return { erro: "Não foi possível realizar a consulta." };
  }

  const cpfHash = crypto
    .createHmac("sha256", cpfSecret)
    .update(cpf)
    .digest("hex");

  const { data: veiculo, error } = await supabaseAdmin
    .from("veiculos")
    .select(
      `
      id,
      placa,
      modelo,
      km_atual,
      km_proxima_revisao,
      nota_proxima_revisao,
      loja:lojas(nome),
      ordens_servico(
        tipo_servico,
        km_no_servico,
        criado_em
      )
      `
    )
    .eq("placa", placa)
    .eq("proprietario_cpf_hash", cpfHash)
    .maybeSingle();

  if (error) {
    console.error("ERRO NA CONSULTA DO VEÍCULO:", error);
    return { erro: "Não foi possível realizar a consulta." };
  }

  if (!veiculo) {
    return {
      erro: "Placa e CPF não correspondem a um veículo cadastrado.",
    };
  }

  return {
    veiculo,
  };
}