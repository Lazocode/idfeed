/**
 * @file feedback.ts
 * @description Server Actions para envio e listagem de opiniões, sugestões e feedbacks de clientes e testadores.
 * Inclui rate limiting por IP, validação estrita de schema com Zod e omissão de dados de contato (LGPD)
 * na listagem pública de contribuições recentes.
 * @module actions/feedback
 * @recommendedPath src/actions/feedback.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import crypto from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { checkFeedbackRateLimit } from "@/lib/rate-limit";
import { feedbackSchema, maskSensitiveName } from "@/lib/validation";

// 3. Tipos e interfaces
import type { FeedbackInput, FeedbackItem } from "@/lib/types";

/**
 * Resposta padrão das operações de submissão de feedback.
 */
export interface FeedbackResponse {
  /** Indica se a operação foi completada com sucesso. */
  success: boolean;
  /** Mensagem informativa ou de erro para exibição ao usuário. */
  message: string;
  /** Identificador gerado caso tenha sido persistido. */
  id?: string;
  /** Indica se foi gravado no banco de dados Supabase. */
  savedToDatabase?: boolean;
}

/**
 * Nome do bucket e caminho do arquivo de backup de feedbacks persistidos (usado apenas em fallback).
 */
const STORAGE_BUCKET = "documentos-oficinas";
const STORAGE_FILE_PATH = "_feedbacks_backup/lista_feedbacks.json";

/**
 * Recupera os feedbacks armazenados no arquivo de backup persistente do Supabase Storage.
 *
 * @returns {Promise<FeedbackItem[]>} Lista de feedbacks salvos no Storage.
 */
async function recuperarFeedbacksDoStorage(): Promise<FeedbackItem[]> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_FILE_PATH);

    if (error || !data) {
      return [];
    }

    const texto = await data.text();
    if (!texto.trim()) return [];
    const parseados = JSON.parse(texto);
    return Array.isArray(parseados) ? parseados : [];
  } catch {
    return [];
  }
}

/**
 * Persiste a lista consolidada de feedbacks no Supabase Storage em caso de indisponibilidade da tabela.
 *
 * @param itens - Lista completa atualizada de feedbacks.
 */
async function persistirFeedbacksNoStorage(itens: FeedbackItem[]): Promise<void> {
  try {
    const conteudoJson = JSON.stringify(itens, null, 2);
    await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_FILE_PATH, conteudoJson, {
        upsert: true,
        contentType: "application/json",
      });
  } catch (err) {
    console.warn("Aviso ao sincronizar feedbacks no Storage de fallback:", err);
  }
}

/**
 * Envia e persiste a opinião ou feedback de um cliente ou testador.
 *
 * MITIGAÇÃO:
 * - Rate Limiting por IP: Impede spam automatizado e exaustão de banco/storage.
 * - Validação Estrita (Zod): Garante que `tipo_usuario`, `categoria` e `avaliacao` pertençam aos domínios válidos.
 *
 * @param input - Dados estruturados do feedback do usuário.
 * @returns {Promise<FeedbackResponse>} Objeto indicando o resultado e status da submissão.
 */
export async function enviarFeedback(
  input: FeedbackInput
): Promise<FeedbackResponse> {
  // 1. Limitação de taxa por IP
  const reqHeaders = await headers();
  const clientIp =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    reqHeaders.get("x-real-ip") ||
    "client-anon";

  if (!checkFeedbackRateLimit(`feedback:ip:${clientIp}`)) {
    return {
      success: false,
      message:
        "Muitos envios recentes. Aguarde alguns minutos antes de enviar um novo feedback.",
    };
  }

  // 2. Validação estrita do payload com Zod
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ||
      "Dados do feedback inválidos. Confira os campos informados.";
    return {
      success: false,
      message: msg,
    };
  }

  const {
    nome,
    contato,
    tipo_usuario,
    categoria,
    avaliacao,
    mensagem,
    pagina_origem,
  } = parsed.data;

  const payload = {
    nome: nome ? nome.slice(0, 100) : null,
    contato: contato ? contato.slice(0, 120) : null,
    tipo_usuario,
    categoria,
    avaliacao: typeof avaliacao === "number" ? Math.round(avaliacao) : null,
    mensagem: mensagem.slice(0, 3000),
    pagina_origem: pagina_origem ? pagina_origem.slice(0, 200) : null,
  };

  const novoId = crypto.randomUUID();
  const novoItem: FeedbackItem = {
    id: novoId,
    ...payload,
    criado_em: new Date().toISOString(),
  };

  try {
    // 3. Inserção primária na tabela 'feedbacks' do Supabase
    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.warn(
        "Tabela 'feedbacks' ausente ou inacessível no Supabase. Utilizando persistência no Storage:",
        error.message
      );

      // Fallback exclusivo quando a tabela não existe no banco
      const listaExistente = await recuperarFeedbacksDoStorage();
      const listaAtualizada = [novoItem, ...listaExistente].slice(0, 100);
      await persistirFeedbacksNoStorage(listaAtualizada);

      revalidatePath("/feedback");

      return {
        success: true,
        savedToDatabase: false,
        id: novoId,
        message: "Muito obrigado! Sua opinião foi registrada com sucesso.",
      };
    }

    revalidatePath("/feedback");

    return {
      success: true,
      savedToDatabase: true,
      id: data?.id || novoId,
      message: "Muito obrigado! Seu feedback foi enviado com sucesso.",
    };
  } catch (err) {
    console.error("Exceção ao processar feedback, gravando no Storage:", err);

    try {
      const listaExistente = await recuperarFeedbacksDoStorage();
      const listaAtualizada = [novoItem, ...listaExistente].slice(0, 100);
      await persistirFeedbacksNoStorage(listaAtualizada);

      revalidatePath("/feedback");

      return {
        success: true,
        savedToDatabase: false,
        id: novoId,
        message:
          "Opinião registrada com sucesso! Agradecemos sua colaboração.",
      };
    } catch (storageErr) {
      console.error("Falha ao gravar no Storage:", storageErr);
      return {
        success: false,
        message:
          "Não foi possível registrar o feedback no momento. Tente novamente.",
      };
    }
  }
}

/**
 * Sanitiza um item de feedback antes de expô-lo na listagem pública (remove `contato` e mascara sobrenomes).
 *
 * MITIGAÇÃO: Vazamento de PII (E-mail / Telefone WhatsApp) na página pública `/feedback`.
 *
 * @param item - Registro bruto de feedback.
 * @returns Registro higienizado seguro para visualização pública.
 */
function sanitizarFeedbackPublico(item: FeedbackItem): FeedbackItem {
  return {
    id: item.id,
    nome: item.nome ? maskSensitiveName(item.nome) : null,
    contato: null, // Jamais expor telefone/e-mail de usuários em listagens públicas
    tipo_usuario: item.tipo_usuario,
    categoria: item.categoria,
    avaliacao: item.avaliacao ?? null,
    mensagem: item.mensagem,
    pagina_origem: item.pagina_origem ?? null,
    criado_em: item.criado_em,
  };
}

/**
 * Recupera os feedbacks recentes enviados por clientes e testadores com proteção de dados pessoais (LGPD).
 *
 * @param limite - Quantidade máxima de registros a serem retornados (padrão: 30, teto: 50).
 * @returns {Promise<FeedbackItem[]>} Lista ordenada e higienizada de feedbacks cadastrados.
 */
export async function listarFeedbacks(limite = 30): Promise<FeedbackItem[]> {
  const limiteSeguro = Math.min(
    50,
    Math.max(1, Number.isInteger(limite) ? limite : 30)
  );

  try {
    // Seleciona apenas colunas públicas (exclui explicitamente `contato`)
    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .select(
        "id, nome, tipo_usuario, categoria, avaliacao, mensagem, pagina_origem, criado_em"
      )
      .order("criado_em", { ascending: false })
      .limit(limiteSeguro);

    if (!error && Array.isArray(data) && data.length > 0) {
      return (data as FeedbackItem[]).map(sanitizarFeedbackPublico);
    }
  } catch (err) {
    console.warn("Aviso ao buscar tabela feedbacks:", err);
  }

  // Fallback: Recupera registros do Supabase Storage e remove PII
  try {
    const doStorage = await recuperarFeedbacksDoStorage();
    return doStorage.slice(0, limiteSeguro).map(sanitizarFeedbackPublico);
  } catch (err) {
    console.warn("Exceção ao listar feedbacks do Storage:", err);
    return [];
  }
}
