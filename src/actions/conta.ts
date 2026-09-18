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
 * Cadastra uma nova oficina no status 'pendente' e cria o usuário responsável com papel operacional.
 *
 * MITIGAÇÃO:
 * - Brute Force & DoS de CPU (Bcrypt): Aplica limitação de taxa por IP/identificador para conter robôs.
 * - Privilege Escalation: Atribui estritamente papel 'mecanico' (o papel 'admin' é restrito à lista VIP).
 * - Sensitive Data Exposure: Criptografa senhas com bcrypt custo 12 e armazena CPF exclusivamente como HMAC-SHA256.
 *
 * @param formData - Dados do formulário de cadastro (oficina, responsável, credenciais e contatos).
 * @throws {Error} Se a validação dos dados falhar, rate limit for excedido ou se e-mail/CPF/CNPJ já existirem.
 * @returns {Promise<never>} Redireciona para a tela de login com flag `criada=1`.
 */
export async function criarContaLoja(formData: FormData): Promise<never> {
  // 1. Validação estrita do payload via Zod
  const parsed = signupSchema.safeParse({
    nomeLoja: formData.get("nomeLoja"),
    nome: formData.get("nome"),
    cpf: formData.get("cpf"),
    telefone: formData.get("telefone"),
    email: formData.get("email"),
    cnpj: formData.get("cnpj"),
    telefoneLoja: formData.get("telefoneLoja"),
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    throw new Error("Confira os dados informados.");
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
    throw new Error("Muitas tentativas de cadastro recentes. Aguarde alguns minutos antes de tentar novamente.");
  }

  // 3. Verifica duplicidade de e-mail de usuário
  const { data: existingEmail } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (existingEmail) {
    throw new Error("Já existe uma conta com este e-mail.");
  }

  // 4. Chave de assinatura usada para gerar o HMAC do CPF
  const cpfSecret = process.env.CPF_HASH_SECRET;

  if (!cpfSecret) {
    console.error("ERRO DE SEGURANÇA: CPF_HASH_SECRET não configurado.");
    throw new Error("Configuração de segurança ausente.");
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
    throw new Error("Já existe uma conta cadastrada com este CPF.");
  }

  // 6. Verifica duplicidade de CNPJ da oficina
  const { data: existingCnpj } = await supabaseAdmin
    .from("lojas")
    .select("id")
    .eq("cnpj", cnpj)
    .maybeSingle();

  if (existingCnpj) {
    throw new Error("Já existe uma oficina cadastrada com este CNPJ.");
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
    throw new Error("Não foi possível criar a oficina.");
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

    throw new Error("Não foi possível criar a conta. Tente novamente.");
  }

  // Redireciona o usuário para o login com mensagem de sucesso
  redirect("/loja/login?criada=1");
}

