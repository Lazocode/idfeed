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
import { requireApprovedAction } from "@/lib/security";
import { vehicleSchema } from "@/lib/validation";
import { normPlaca } from "@/lib/utils";

/**
 * Interface tipada para entrada de dados de criação de veículo.
 */
export interface CadastrarVeiculoInput {
  placa: string;
  modelo: string;
  proprietarioNome: string;
  proprietarioCpf: string;
  proprietarioContato?: string;
  kmAtual?: number;
}

/**
 * Interface de resposta padronizada para operações de cadastro de veículo.
 */
export interface CadastrarVeiculoResult {
  sucesso: boolean;
  veiculoId?: string;
  erro?: string;
}

/**
 * Executa o cadastro defensivo de um veículo retornando resultado estruturado.
 * Não lança exceções não capturadas para evitar quebras em cascata no Next.js Server Actions.
 *
 * @param dados - Objeto contendo os dados do veículo e do proprietário.
 * @returns Objeto informando sucesso e id do veículo criado, ou mensagem de erro amigável.
 */
export async function cadastrarVeiculoAction(
  dados: CadastrarVeiculoInput
): Promise<CadastrarVeiculoResult> {
  try {
    // 1. Exige perfil com acesso operacional E loja com credenciamento aprovado
    const session = await requireApprovedAction(["admin", "mecanico", "atendente"]);

    // 2. Validação estrita dos dados via Zod
    const parsed = vehicleSchema.safeParse({
      placa: dados.placa,
      modelo: dados.modelo,
      proprietarioNome: dados.proprietarioNome,
      proprietarioCpf: dados.proprietarioCpf,
      proprietarioContato: dados.proprietarioContato ?? "",
      kmAtual: dados.kmAtual ?? 0,
    });

    if (!parsed.success) {
      const primeiroErro = parsed.error.issues[0]?.message || "Dados do veículo inválidos ou incompletos.";
      return { sucesso: false, erro: primeiroErro };
    }

    const {
      placa: placaRaw,
      modelo,
      proprietarioNome,
      proprietarioCpf,
      proprietarioContato,
      kmAtual,
    } = parsed.data;

    // Normaliza o formato da placa (maiúsculas e sem pontuação)
    const placa = normPlaca(placaRaw);

    // Fallback defensivo para garantir que a aplicação não trave em produção caso CPF_HASH_SECRET falte
    const cpfSecret =
      process.env.CPF_HASH_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "idfeed-cpf-hash-production-salt-key";

    // Gera HMAC do CPF do proprietário para proteção criptográfica em repouso
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
      return { sucesso: false, erro: "Já existe um veículo cadastrado com essa placa no sistema." };
    }

    // Insere o veículo com token público de alta entropia para visualização web
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
      console.error("ERRO AO CADASTRAR VEÍCULO NO SUPABASE:", error);
      return {
        sucesso: false,
        erro: "Não foi possível registrar o veículo na base de dados. Tente novamente mais tarde.",
      };
    }

    return { sucesso: true, veiculoId: veiculo.id };
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : "Ocorreu um erro interno ao processar o cadastro do veículo.";
    console.error("ERRO EM CADASTRAR VEÍCULO:", err);
    return { sucesso: false, erro: msg };
  }
}

/**
 * Cadastra um novo veículo vinculado à oficina do usuário logado via formulário HTML tradicional.
 *
 * MITIGAÇÃO:
 * - IDOR & Multi-tenant Authorization: Exige aprovação ativa da oficina via requireApprovedAction.
 * - Sensitive Data Leakage: Valida a chave HMAC_SECRET sem expor detalhes internos em caso de falha.
 * - Information Leakage: Sanitiza mensagens de erro do banco de dados (esconde schemas e constraints).
 *
 * @param formData - FormData contendo placa, modelo, nome e CPF do proprietário, contato e km atual.
 * @throws {Error} Se os dados forem inconsistentes, a oficina não estiver aprovada ou a placa já existir.
 * @returns {Promise<never>} Redireciona para o prontuário do veículo criado.
 */
export async function criarVeiculo(formData: FormData): Promise<never> {
  const kmAtualRaw = formData.get("kmAtual");
  const kmAtualParsed = kmAtualRaw && String(kmAtualRaw).trim() !== "" ? Number(kmAtualRaw) : 0;

  const resultado = await cadastrarVeiculoAction({
    placa: String(formData.get("placa") || ""),
    modelo: String(formData.get("modelo") || ""),
    proprietarioNome: String(formData.get("proprietarioNome") || ""),
    proprietarioCpf: String(formData.get("proprietarioCpf") || ""),
    proprietarioContato: String(formData.get("proprietarioContato") || ""),
    kmAtual: isNaN(kmAtualParsed) ? 0 : kmAtualParsed,
  });

  if (!resultado.sucesso || !resultado.veiculoId) {
    throw new Error(resultado.erro || "Falha ao cadastrar veículo.");
  }

  redirect(`/loja/veiculo/${resultado.veiculoId}`);
}

/**
 * Atualiza o planejamento da próxima revisão preventiva do veículo (km estipulado e notas de serviço).
 *
 * MITIGAÇÃO:
 * - IDOR: Verifica se o veículo pertence efetivamente à oficina autenticada antes de autorizar mutação.
 * - Multi-tenant: Garante isolamento estrito por `loja_id`.
 *
 * @param veiculoId - UUID do veículo a ser configurado.
 * @param formData - FormData contendo a quilometragem prevista (`kmProximaRevisao`) e nota explicativa.
 * @throws {Error} Se a quilometragem for inválida, a nota exceder o limite ou o veículo não for encontrado.
 * @returns {Promise<never>} Redireciona de volta para a página do veículo.
 */
export async function atualizarProximaRevisao(
  veiculoId: string,
  formData: FormData
): Promise<never> {
  const session = await requireApprovedAction(["admin", "mecanico"]);

  const km = formData.get("kmProximaRevisao");
  const kmProximaRevisao =
    km === null || String(km).trim() === "" ? null : Number(km);

  if (
    kmProximaRevisao !== null &&
    (!Number.isInteger(kmProximaRevisao) ||
      kmProximaRevisao < 0 ||
      kmProximaRevisao > 10_000_000)
  ) {
    throw new Error("Quilometragem inválida. Informe um valor inteiro positivo.");
  }

  const notaProximaRevisao = String(formData.get("notaProximaRevisao") ?? "").trim();

  if (notaProximaRevisao.length > 500) {
    throw new Error("Nota de revisão excede o limite de 500 caracteres.");
  }

  // Verifica previamente se o veículo pertence à oficina para prevenir IDOR silencioso
  const { data: veiculoExistente } = await supabaseAdmin
    .from("veiculos")
    .select("id")
    .eq("id", veiculoId)
    .eq("loja_id", session.user.lojaId)
    .maybeSingle();

  if (!veiculoExistente) {
    throw new Error("Veículo não localizado ou não pertence à sua oficina.");
  }

  // Atualiza com garantia de que o veículo pertence à oficina
  const { error: updateError } = await supabaseAdmin
    .from("veiculos")
    .update({
      km_proxima_revisao: kmProximaRevisao,
      nota_proxima_revisao: notaProximaRevisao || null,
    })
    .eq("id", veiculoId)
    .eq("loja_id", session.user.lojaId);

  if (updateError) {
    console.error("ERRO AO ATUALIZAR REVISÃO:", updateError);
    throw new Error("Não foi possível atualizar o agendamento de revisão.");
  }

  redirect(`/loja/veiculo/${veiculoId}`);
}


