/**
 * @file veiculos.ts
 * @description Server Actions para cadastro e gestão de veículos e agendamento de revisões preventivas.
 * Normaliza placas (padrão antigo e Mercosul), computa hash HMAC seguro do CPF e gera tokens públicos de acesso.
 * @module actions/veiculos
 * @recommendedPath src/actions/veiculos.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import crypto from "node:crypto";
import { redirect } from "next/navigation";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/security";
import { vehicleSchema } from "@/lib/validation";
import { normPlaca } from "@/lib/utils";

/**
 * Cadastra um novo veículo vinculado à oficina do usuário logado.
 *
 * @param formData - FormData contendo placa, modelo, nome e CPF do proprietário, contato e km atual.
 * @throws {Error} Se os dados forem inconsistentes, o CPF secret faltar ou a placa já existir.
 * @returns {Promise<never>} Redireciona para o prontuário do veículo criado.
 */
export async function criarVeiculo(formData: FormData): Promise<never> {
  // Exige perfil com acesso operacional
  const session = await requireRole(["admin", "mecanico", "atendente"]);

  // Validação dos dados via Zod
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

  // Normaliza o formato da placa (maiúsculas e sem hifens)
  const placa = normPlaca(placaRaw);

  const cpfSecret = process.env.CPF_HASH_SECRET;

  if (!cpfSecret) {
    throw new Error("Configuração de segurança do CPF não encontrada.");
  }

  // Gera HMAC do CPF do proprietário para consultas seguras
  const cpfHash = crypto
    .createHmac("sha256", cpfSecret)
    .update(proprietarioCpf)
    .digest("hex");

  // Garante unicidade global da placa
  const { data: existente } = await supabaseAdmin
    .from("veiculos")
    .select("id")
    .eq("placa", placa)
    .maybeSingle();

  if (existente) {
    throw new Error("Já existe um veículo cadastrado com essa placa.");
  }

  // Insere o veículo com token público para visualização web
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

/**
 * Atualiza o planejamento da próxima revisão preventiva do veículo (km estipulado e notas de serviço).
 *
 * @param veiculoId - UUID do veículo a ser configurado.
 * @param formData - FormData contendo a quilometragem prevista (`kmProximaRevisao`) e nota explicativa.
 * @throws {Error} Se a quilometragem informada for inválida ou a nota ultrapassar 500 caracteres.
 * @returns {Promise<never>} Redireciona de volta para a página do veículo.
 */
export async function atualizarProximaRevisao(
  veiculoId: string,
  formData: FormData
): Promise<never> {
  const session = await requireRole(["admin", "mecanico"]);

  const km = formData.get("kmProximaRevisao");
  const kmProximaRevisao =
    km === null || String(km).trim() === "" ? null : Number(km);

  if (
    kmProximaRevisao !== null &&
    (!Number.isInteger(kmProximaRevisao) ||
      kmProximaRevisao < 0 ||
      kmProximaRevisao > 10_000_000)
  ) {
    throw new Error("Quilometragem inválida.");
  }

  const notaProximaRevisao = String(formData.get("notaProximaRevisao") ?? "").trim();

  if (notaProximaRevisao.length > 500) {
    throw new Error("Nota muito longa.");
  }

  // Atualiza com garantia de que o veículo pertence à oficina
  await supabaseAdmin
    .from("veiculos")
    .update({
      km_proxima_revisao: kmProximaRevisao,
      nota_proxima_revisao: notaProximaRevisao || null,
    })
    .eq("id", veiculoId)
    .eq("loja_id", session.user.lojaId);

  redirect(`/loja/veiculo/${veiculoId}`);
}

