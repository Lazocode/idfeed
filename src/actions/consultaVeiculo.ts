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
import { headers } from "next/headers";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { normPlaca } from "@/lib/utils";
import { checkPublicSearchRateLimit } from "@/lib/rate-limit";
import { maskSensitiveName } from "@/lib/validation";

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
 * MITIGAÇÃO:
 * - Rate Limiting & Força Bruta: Limita requisições por IP e por Placa para impedir adivinhação de CPF.
 * - PII Data Leakage (LGPD): Mascara o nome completo do proprietário retornado na resposta pública.
 * - User/Plate Enumeration: Retorna mensagem idêntica para placa inexistente ou CPF divergente.
 * - Timing Attack: Computa hash de tamanho constante e executa busca indexada com tratamento uniforme.
 *
 * COMPORTAMENTO DEFENSIVO: Se a taxa for excedida ou parâmetros forem inválidos, a requisição é barrada
 * antes de onerar a base de dados, retornando código de erro amigável sem expor dados internos.
 *
 * @param placaInput - Placa informada pelo usuário (padrão antigo ou Mercosul).
 * @param cpfInput - CPF do proprietário informado (apenas números ou formatado).
 * @returns Objeto com os dados do prontuário protegido e histórico de manutenções ou mensagem de erro.
 */
export async function ConsultarVeiculo(
  placaInput: string,
  cpfInput: string
): Promise<ConsultaVeiculoResponse> {
  // 1. Extração do IP do cliente para rate limiting perimétrico
  const reqHeaders = await headers();
  const clientIp =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    reqHeaders.get("x-real-ip") ||
    "client-anon";

  // Normaliza e limpa placa e CPF
  const placa = normPlaca(placaInput);
  const cpf = (cpfInput || "").replace(/\D/g, "");

  // 2. Proteção contra Força Bruta / Dicionário por IP e por Placa
  const ipAllowed = checkPublicSearchRateLimit(`search:ip:${clientIp}`);
  const placaAllowed = checkPublicSearchRateLimit(`search:placa:${placa || "unknown"}`);

  if (!ipAllowed || !placaAllowed) {
    return {
      erro: "Muitas tentativas de consulta. Por motivos de segurança, aguarde um minuto e tente novamente.",
    };
  }

  // 3. Validação formal estrita de formato
  if (!/^[A-Z0-9]{7}$/.test(placa)) {
    return { erro: "Placa com formato inválido. Utilize padrão Mercosul ou convencional." };
  }

  if (!/^\d{11}$/.test(cpf)) {
    return { erro: "CPF deve conter 11 dígitos numéricos." };
  }

  // Fallback defensivo para garantir alta disponibilidade mesmo se a variável não tiver sido setada no deploy
  const cpfSecret =
    process.env.CPF_HASH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "idfeed-cpf-hash-production-salt-key";

  // 4. Gera o hash criptográfico seguro do CPF para comparação no banco
  const cpfHash = crypto
    .createHmac("sha256", cpfSecret)
    .update(cpf)
    .digest("hex");

  // 5. Consulta o prontuário cruzando placa e proprietario_cpf_hash
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
    console.error("ERRO INTERNO NA CONSULTA DO VEÍCULO:", error);
    return { erro: "Não foi possível realizar a consulta no momento." };
  }

  // Mensagem unificada para mitigar enumeração de placas existentes
  if (!veiculo) {
    return {
      erro: "Veículo não localizado ou dados informados não conferem com o prontuário registrado.",
    };
  }

  // 6. Proteção PII: Mascara o nome do titular para salvaguarda de dados pessoais (LGPD)
  const veiculoProtegido = {
    ...veiculo,
    proprietario_nome: maskSensitiveName(veiculo.proprietario_nome),
  };

  return {
    veiculo: veiculoProtegido as unknown as ConsultaVeiculoResponse["veiculo"],
  };
}

