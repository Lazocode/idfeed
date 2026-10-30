/**
 * @file consultaVeiculo.ts
 * @description Server Action pública para consulta autenticada do prontuário digital veicular.
 * Realiza validação de formato e dígitos verificadores de CPF, comparação criptográfica via HMAC-SHA256
 * e auditoria pública exclusiva por `public_token` (mitigando IDOR por UUID interno).
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
import { getCpfHashSecret } from "@/lib/security";
import { isValidCpf, maskSensitiveName } from "@/lib/validation";

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
    public_token?: string;
    loja: { nome: string } | { nome: string }[] | null;
    ordens_servico: Array<{
      tipo_servico: string;
      km_no_servico: number;
      criado_em: string;
    }>;
  };
}

/**
 * Expressão regular para validação do token criptográfico público (hexadecimal de 32 a 64 caracteres).
 */
const PUBLIC_TOKEN_REGEX = /^[a-f0-9]{32,64}$/i;

/**
 * Realiza a consulta de prontuário veicular aberto a clientes e terceiros.
 * Exige a placa normalizada e valida o CPF através de hash HMAC-SHA256 com segredo do servidor.
 *
 * MITIGAÇÃO:
 * - Rate Limiting & Força Bruta: Limita requisições por IP e por Placa para impedir adivinhação de CPF.
 * - PII Data Leakage (LGPD): Mascara o nome completo do proprietário e oculta o UUID interno do banco na resposta pública.
 * - User/Plate Enumeration: Retorna mensagem idêntica para placa inexistente ou CPF divergente.
 * - Hardcoded Secret Elimination: Obtém o segredo via `getCpfHashSecret()` sem fallback estático previsível.
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
  const placaAllowed = checkPublicSearchRateLimit(
    `search:placa:${placa || "unknown"}`
  );

  if (!ipAllowed || !placaAllowed) {
    return {
      erro: "Muitas tentativas de consulta. Por motivos de segurança, aguarde um minuto e tente novamente.",
    };
  }

  // 3. Validação formal estrita de formato e dígitos verificadores
  if (!/^[A-Z0-9]{7}$/.test(placa)) {
    return {
      erro: "Placa com formato inválido. Utilize padrão Mercosul ou convencional.",
    };
  }

  if (!isValidCpf(cpf)) {
    return { erro: "CPF inválido. Confira os 11 dígitos informados." };
  }

  let cpfSecret: string;
  try {
    cpfSecret = getCpfHashSecret();
  } catch (err) {
    console.error("ERRO DE CONFIGURAÇÃO DE SEGURANÇA (CPF_HASH_SECRET):", err);
    return { erro: "Não foi possível realizar a consulta no momento." };
  }

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
      placa,
      modelo,
      proprietario_nome,
      km_atual,
      km_proxima_revisao,
      nota_proxima_revisao,
      public_token,
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

  // Ordena ordens de serviço da mais recente para a mais antiga
  const ordensOrdenadas = Array.isArray(veiculo.ordens_servico)
    ? [...veiculo.ordens_servico].sort(
        (a, b) =>
          new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      )
    : [];

  // 6. Proteção PII: Mascara o nome do titular e utiliza public_token como identificador externo
  const veiculoProtegido = {
    ...veiculo,
    id: veiculo.public_token || veiculo.placa,
    ordens_servico: ordensOrdenadas,
    proprietario_nome: maskSensitiveName(veiculo.proprietario_nome),
  };

  return {
    veiculo: veiculoProtegido as unknown as ConsultaVeiculoResponse["veiculo"],
  };
}

/**
 * Realiza a consulta pública e auditoria do prontuário veicular através do Hash / Token de Autenticidade.
 * O hash público do passaporte é um identificador criptográfico único de 48 caracteres hexadecimais que permite
 * atestar a autenticidade de revisões e odômetro sem necessidade de envio do CPF do proprietário.
 *
 * MITIGAÇÃO:
 * - Prevenção de IDOR por UUID Interno: Aceita exclusivamente o `public_token` hexadecimal criptográfico,
 *   bloqueando buscas diretas pela chave primária interna (`veiculos.id`).
 * - Ocultação de Chave Primária: Não retorna o UUID interno do banco na resposta pública.
 *
 * @param hashInput - Token público criptográfico informado pelo usuário.
 * @returns Objeto com os dados do prontuário protegido e histórico de manutenções ou mensagem de erro.
 */
export async function ConsultarVeiculoPorHash(
  hashInput: string
): Promise<ConsultaVeiculoResponse> {
  // 1. Extração do IP do cliente para proteção contra abusos
  const reqHeaders = await headers();
  const clientIp =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    reqHeaders.get("x-real-ip") ||
    "client-anon";

  const ipAllowed = checkPublicSearchRateLimit(`search:hash:${clientIp}`);
  if (!ipAllowed) {
    return {
      erro: "Muitas tentativas de consulta. Por motivos de segurança, aguarde um minuto e tente novamente.",
    };
  }

  // 2. Higienização e validação formal estrita do hash hexadecimal (public_token)
  const cleanHash = (hashInput || "").trim().toLowerCase();

  if (!PUBLIC_TOKEN_REGEX.test(cleanHash)) {
    return {
      erro: "Código hash inválido. Insira o código de autenticidade hexadecimal completo do passaporte digital.",
    };
  }

  try {
    // 3. Busca estrita apenas pelo campo public_token (jamais pelo UUID interno id)
    const { data: veiculo, error: erroToken } = await supabaseAdmin
      .from("veiculos")
      .select(
        `
        placa,
        modelo,
        proprietario_nome,
        km_atual,
        km_proxima_revisao,
        nota_proxima_revisao,
        public_token,
        loja:lojas(nome),
        ordens_servico(
          tipo_servico,
          km_no_servico,
          criado_em
        )
        `
      )
      .eq("public_token", cleanHash)
      .maybeSingle();

    if (erroToken) {
      console.error(
        "ERRO AO CONSULTAR VEÍCULO POR HASH (public_token):",
        erroToken
      );
      return {
        erro: "Falha temporária ao validar hash de autenticidade. Tente novamente.",
      };
    }

    if (!veiculo) {
      return {
        erro: "Prontuário não localizado para o código hash informado. Verifique se digitou o token corretamente.",
      };
    }

    // Ordena ordens de serviço cronologicamente da mais recente para a mais antiga
    const ordensOrdenadas = Array.isArray(veiculo.ordens_servico)
      ? [...veiculo.ordens_servico].sort(
          (a, b) =>
            new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
        )
      : [];

    // 4. Proteção PII: Mascara o nome do titular para salvaguarda de dados pessoais (LGPD)
    const veiculoProtegido = {
      ...veiculo,
      id: veiculo.public_token || veiculo.placa,
      ordens_servico: ordensOrdenadas,
      proprietario_nome: maskSensitiveName(veiculo.proprietario_nome),
    };

    return {
      veiculo: veiculoProtegido as unknown as ConsultaVeiculoResponse["veiculo"],
    };
  } catch (err) {
    console.error("EXCEÇÃO AO CONSULTAR VEÍCULO POR HASH:", err);
    return {
      erro: "Falha temporária ao validar hash de autenticidade. Tente novamente.",
    };
  }
}
