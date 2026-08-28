"use server";

import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { signupSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function criarContaLoja(formData: FormData) {
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

  // Verifica e-mail existente
  const { data: existingEmail } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingEmail) {
    throw new Error("Já existe uma conta com este e-mail.");
  }

  // Chave usada para gerar o HMAC do CPF
  const cpfSecret = process.env.CPF_HASH_SECRET;

  if (!cpfSecret) {
    console.error("CPF_HASH_SECRET não configurado.");
    throw new Error("Configuração de segurança ausente.");
  }

  const cpfHash = crypto
    .createHmac("sha256", cpfSecret)
    .update(cpf)
    .digest("hex");

  // Verifica CPF existente
  const { data: existingCpf } = await supabaseAdmin
    .from("usuarios")
    .select("id")
    .eq("cpf_hash", cpfHash)
    .maybeSingle();

  if (existingCpf) {
    throw new Error("Já existe uma conta cadastrada com este CPF.");
  }

  // Verifica CNPJ existente
  const { data: existingCnpj } = await supabaseAdmin
    .from("lojas")
    .select("id")
    .eq("cnpj", cnpj)
    .maybeSingle();

  if (existingCnpj) {
    throw new Error("Já existe uma oficina cadastrada com este CNPJ.");
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  // Cria a oficina como PENDENTE
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

  // Cria o usuário administrador
  const { error: userError } = await supabaseAdmin
    .from("usuarios")
    .insert({
      loja_id: loja.id,
      nome,
      cpf_hash: cpfHash,
      telefone,
      email,
      senha_hash: senhaHash,
      papel: "admin",
    });

  if (userError) {
    console.error("ERRO AO CRIAR USUÁRIO:", userError);

    // Rollback da oficina se o usuário não puder ser criado
    await supabaseAdmin
      .from("lojas")
      .delete()
      .eq("id", loja.id);

    throw new Error("Não foi possível criar a conta. Tente novamente.");
  }

  redirect("/loja/login?criada=1");
}