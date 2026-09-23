/**
 * @file conta.ts
 * @description Server Actions para criação e credenciamento de oficinas e seus usuários técnicos.
 * Realiza validação estrita com Zod, hashing HMAC do CPF, criptografia bcrypt da senha e transação segura.
 * @module actions/conta
 * @recommendedPath src/actions/conta.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { signupSchema } from "@/lib/validation";
import { checkSignupRateLimit } from "@/lib/rate-limit";

/**
 * Payload estruturado para cadastro de conta e oficina.
 */
export interface CriarContaLojaInput {
  /** Nome fantasia da oficina mecânica. */
  nomeLoja: string;
  /** Nome completo do responsável legal. */
  nome: string;
  /** CPF do responsável (com ou sem pontuação). */
  cpf: string;
  /** Telefone do responsável (com ou sem DDI +55). */
  telefone: string;
  /** E-mail corporativo ou pessoal para login. */
  email: string;
  /** CNPJ da oficina (com ou sem pontuação). */
  cnpj: string;
  /** Telefone comercial da oficina (com ou sem DDI +55). */
  telefoneLoja: string;
  /** Senha de acesso com ao menos 10 caracteres. */
  senha: string;
  /** Confirmação idêntica da senha. */
  confirmarSenha: string;
}

/**
 * Resultado estruturado da ação de cadastro de oficina.
 */
export interface CriarContaLojaResult {
  /** Indica se o cadastro foi concluído com sucesso. */
  sucesso: boolean;
  /** Mensagem descritiva de erro quando a operação falha. */
  erro?: string;
}

/**
 * Cadastra uma nova oficina no status 'pendente' e cria o usuário responsável de forma segura,
 * retornando uma resposta estruturada sem disparar exceções não tratadas na interface.
 *
 * MITIGAÇÃO:
 * - Brute Force & DoS de CPU (Bcrypt): Aplica limitação de taxa por IP/identificador para conter robôs.
 * - Privilege Escalation: Atribui estritamente papel 'mecanico' (o papel 'admin' é restrito à lista VIP).
 * - Sensitive Data Exposure: Criptografa senhas com bcrypt custo 12 e armazena CPF exclusivamente como HMAC-SHA256.
 *
 * @param dados - Objeto tipado com todos os dados do formulário de credenciamento.
 * @returns {Promise<CriarContaLojaResult>} Objeto indicando sucesso ou mensagem amigável de erro.
 */
export async function criarContaLojaAction(
  dados: CriarContaLojaInput
): Promise<CriarContaLojaResult> {
  try {
    // 1. Validação estrita do payload via Zod com suporte a +55 e normalização de telefones
    const parsed = signupSchema.safeParse(dados);

    if (!parsed.success) {
      const primeiroErro =
        parsed.error.issues[0]?.message || "Por favor, confira os dados informados.";
      return { sucesso: false, erro: primeiroErro };
    }

    const {
      nomeLoja,
      nome,
      cpf,
      telefone,
      email,
      cnpj,
      telefoneLoja,
      senha,
    } = parsed.data;

    // 2. Proteção contra criação automatizada de contas e exaustão de CPU via bcrypt
    const rateLimitKey = `signup:${email.toLowerCase().trim()}`;
    if (!checkSignupRateLimit(rateLimitKey)) {
      return {
        sucesso: false,
        erro: "Muitas tentativas de cadastro recentes. Aguarde alguns minutos antes de tentar novamente.",
      };
    }

    // 3. Verifica duplicidade de e-mail de usuário
    const { data: existingEmail } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingEmail) {
      return {
        sucesso: false,
        erro: "Já existe uma conta cadastrada com este endereço de e-mail.",
      };
    }

    // 4. Chave de assinatura usada para gerar o HMAC do CPF
    const cpfSecret = process.env.CPF_HASH_SECRET;

    if (!cpfSecret) {
      console.error("ERRO DE SEGURANÇA: CPF_HASH_SECRET não configurado.");
      return {
        sucesso: false,
        erro: "Configuração de segurança do servidor ausente.",
      };
    }

    const cpfHash = crypto
      .createHmac("sha256", cpfSecret)
      .update(cpf)
      .digest("hex");

    // 5. Verifica duplicidade de CPF cadastrado
    const { data: existingCpf } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("cpf_hash", cpfHash)
      .maybeSingle();

    if (existingCpf) {
      return {
        sucesso: false,
        erro: "Já existe uma conta cadastrada com este CPF.",
      };
    }

    // 6. Verifica duplicidade de CNPJ da oficina
    const { data: existingCnpj } = await supabaseAdmin
      .from("lojas")
      .select("id")
      .eq("cnpj", cnpj)
      .maybeSingle();

    if (existingCnpj) {
      return {
        sucesso: false,
        erro: "Já existe uma oficina cadastrada com este CNPJ.",
      };
    }

    // 7. Gera o hash seguro da senha com fator de custo 12
    const senhaHash = await bcrypt.hash(senha, 12);

    // 8. Cria o registro da oficina com status PENDENTE de aprovação
    const { data: loja, error: lojaError } = await supabaseAdmin
      .from("lojas")
      .insert({
        nome: nomeLoja,
        cnpj,
        telefone: telefoneLoja,
        status: "pendente",
      })
      .select("id")
      .single();

    if (lojaError || !loja) {
      console.error("ERRO AO CRIAR LOJA:", lojaError);
      return {
        sucesso: false,
        erro: "Não foi possível criar a oficina. Tente novamente em instantes.",
      };
    }

    // 9. Cria o usuário da oficina (papel operacional 'mecanico'; papel 'admin' é restrito exclusivamente ao superadministrador)
    const { error: userError } = await supabaseAdmin
      .from("usuarios")
      .insert({
        loja_id: loja.id,
        nome,
        cpf_hash: cpfHash,
        telefone,
        email: email.toLowerCase().trim(),
        senha_hash: senhaHash,
        papel: "mecanico",
      });

    if (userError) {
      console.error("ERRO AO CRIAR USUÁRIO:", userError);

      // Rollback: remove o registro da loja se a criação do usuário falhar
      await supabaseAdmin
        .from("lojas")
        .delete()
        .eq("id", loja.id);

      return {
        sucesso: false,
        erro: "Não foi possível criar a credencial de acesso. Tente novamente.",
      };
    }

    return { sucesso: true };
  } catch (err: unknown) {
    console.error("ERRO INESPERADO EM CRIAR CONTA LOJA:", err);
    return {
      sucesso: false,
      erro: "Ocorreu um erro interno ao processar o cadastro. Tente novamente.",
    };
  }
}

/**
 * Cadastra uma nova oficina via formulário HTML tradicional e redireciona ao login.
 *
 * @param formData - Dados do formulário de cadastro.
 * @throws {Error} Se os dados forem inválidos ou houver falha na persistência.
 * @returns {Promise<never>} Redireciona para a tela de login com flag `criada=1`.
 */
export async function criarContaLoja(formData: FormData): Promise<never> {
  const resultado = await criarContaLojaAction({
    nomeLoja: String(formData.get("nomeLoja") || ""),
    nome: String(formData.get("nome") || ""),
    cpf: String(formData.get("cpf") || ""),
    telefone: String(formData.get("telefone") || ""),
    email: String(formData.get("email") || ""),
    cnpj: String(formData.get("cnpj") || ""),
    telefoneLoja: String(formData.get("telefoneLoja") || ""),
    senha: String(formData.get("senha") || ""),
    confirmarSenha: String(formData.get("confirmarSenha") || ""),
  });

  if (!resultado.sucesso) {
    throw new Error(resultado.erro || "Falha ao criar conta.");
  }

  // Redireciona o usuário para o login com mensagem de sucesso
  redirect("/loja/login?criada=1");
}

