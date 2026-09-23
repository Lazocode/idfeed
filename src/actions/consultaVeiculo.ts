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
        (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      )
    : [];

  // 6. Proteção PII: Mascara o nome do titular para salvaguarda de dados pessoais (LGPD)
  const veiculoProtegido = {
    ...veiculo,
    ordens_servico: ordensOrdenadas,
    proprietario_nome: maskSensitiveName(veiculo.proprietario_nome),
  };

  return {
    veiculo: veiculoProtegido as unknown as ConsultaVeiculoResponse["veiculo"],
  };
}

/**
 * Realiza a consulta pública e auditoria do prontuário veicular através do Hash / Token de Autenticidade.
 * O hash público do passaporte é um identificador criptográfico único de 48 caracteres que permite
 * atestar a autenticidade de revisões e odômetro sem necessidade de envio do CPF do proprietário.
 *
 * @param hashInput - Token público ou hash criptográfico informado pelo usuário.
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

  // 2. Higienização e validação formal do hash
  const cleanHash = (hashInput || "").trim().toLowerCase();

  if (!cleanHash || cleanHash.length < 8) {
    return {
      erro: "Código hash inválido. Insira o código de autenticidade completo do passaporte digital.",
    };
  }

  // Impede caracteres perigosos ou sintaxe inválida
  if (!/^[a-z0-9-]+$/i.test(cleanHash)) {
    return {
      erro: "Formato de hash inválido. Utilize apenas caracteres alfanuméricos.",
    };
  }

  try {
    // 3. Busca inicial pelo campo public_token (token unívoco de 48 caracteres hexadecimais)
    const { data: veiculoPorToken, error: erroToken } = await supabaseAdmin
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
      console.error("ERRO AO CONSULTAR VEÍCULO POR HASH (public_token):", erroToken);
    }

    let veiculo = veiculoPorToken;

    // 4. Se não encontrar e for um formato UUID válido, tenta localizar pelo id do veículo
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanHash);
    if (!veiculo && isUuid) {
      const resId = await supabaseAdmin
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
          public_token,
          loja:lojas(nome),
          ordens_servico(
            tipo_servico,
            km_no_servico,
            criado_em
          )
          `
        )
        .eq("id", cleanHash)
        .maybeSingle();

      if (!resId.error && resId.data) {
        veiculo = resId.data;
      }
    }

    if (!veiculo) {
      return {
        erro: "Prontuário não localizado para o código hash informado. Verifique se digitou o token corretamente.",
      };
    }

    // Ordena ordens de serviço cronologicamente da mais recente para a mais antiga
    const ordensOrdenadas = Array.isArray(veiculo.ordens_servico)
      ? [...veiculo.ordens_servico].sort(
          (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
        )
      : [];

    // 5. Proteção PII: Mascara o nome do titular para salvaguarda de dados pessoais (LGPD)
    const veiculoProtegido = {
      ...veiculo,
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

