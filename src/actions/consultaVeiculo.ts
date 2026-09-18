/**
 * @file consultaVeiculo.ts
 * @description Server Action pública para consulta autenticada do prontuário digital veicular.
 * Realiza validação de formato e comparação criptográfica via HMAC-SHA256 do CPF do proprietário.
 * @module actions/consultaVeiculo
 * @recommendedPath src/actions/consultaVeiculo.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import crypto from "node:crypto";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { normPlaca } from "@/lib/utils";

/**
 * Resposta estruturada da consulta veicular digital.
 */
export interface ConsultaVeiculoResponse {
  erro?: string;
  veiculo?: {
    id: string;
    placa: string;
    modelo: string;
    proprietario_nome?: string;
    km_atual: number;
    km_proxima_revisao: number | null;
    nota_proxima_revisao: string | null;
    loja: { nome: string } | { nome: string }[] | null;
    ordens_servico: Array<{
      tipo_servico: string;
      km_no_servico: number;
      criado_em: string;
    }>;
  };
}

/**
 * Realiza a consulta de prontuário veicular aberto a clientes e terceiros.
 * Exige a placa normalizada e valida o CPF através de hash HMAC-SHA256 com segredo do servidor.
 *
 * @param placaInput - Placa informada pelo usuário (padrão antigo ou Mercosul).
 * @param cpfInput - CPF do proprietário informado (apenas números ou formatado).
 * @returns Objeto com os dados do prontuário e histórico de manutenções ou mensagem de erro.
 */
export async function ConsultarVeiculo(
  placaInput: string,
  cpfInput: string
): Promise<ConsultaVeiculoResponse> {
  // Normaliza e limpa placa e CPF
  const placa = normPlaca(placaInput);
  const cpf = cpfInput.replace(/\D/g, "");

  // Validação formal de formato
  if (!/^[A-Z0-9]{7}$/.test(placa)) {
    return { erro: "Placa inválida." };
  }

  if (!/^\d{11}$/.test(cpf)) {
    return { erro: "CPF inválido." };
  }

  const cpfSecret = process.env.CPF_HASH_SECRET;

  if (!cpfSecret) {
    console.error("CPF_HASH_SECRET não configurado no ambiente.");
    return { erro: "Não foi possível realizar a consulta." };
  }

  // Gera o hash criptográfico seguro do CPF para comparação no banco
  const cpfHash = crypto
    .createHmac("sha256", cpfSecret)
    .update(cpf)
    .digest("hex");

  // Consulta o prontuário cruzando placa e proprietario_cpf_hash
  const { data: veiculo, error } = await supabaseAdmin
    .from("veiculos")
    .select(
      `
      id,
      placa,
      modelo,
      proprietario_nome,
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
    veiculo: veiculo as unknown as ConsultaVeiculoResponse["veiculo"],
  };
}
