"use server";

import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validation";
import { redirect } from "next/navigation";

export async function criarContaLoja(formData: FormData) {
  const parsed = signupSchema.safeParse({
    nomeLoja: formData.get("nomeLoja"),
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });
  if (!parsed.success) throw new Error("Confira os dados informados. A senha deve ter pelo menos 10 caracteres.");

  const { nomeLoja, nome, email, senha } = parsed.data;
  const { data: existing } = await supabaseAdmin.from("usuarios").select("id").eq("email", email).maybeSingle();
  if (existing) throw new Error("Já existe uma conta com este e-mail.");

  const senhaHash = await bcrypt.hash(senha, 12);
  const { data: loja, error: lojaError } = await supabaseAdmin.from("lojas").insert({ nome: nomeLoja }).select("id").single();
  if (lojaError || !loja) throw new Error("Não foi possível criar a loja.");

  const { error: userError } = await supabaseAdmin.from("usuarios").insert({
    loja_id: loja.id,
    nome,
    email,
    senha_hash: senhaHash,
    papel: "admin",
  });

  if (userError) {
    await supabaseAdmin.from("lojas").delete().eq("id", loja.id);
    throw new Error("Não foi possível criar a conta. Tente novamente.");
  }

  redirect("/loja/login?criada=1");
}
