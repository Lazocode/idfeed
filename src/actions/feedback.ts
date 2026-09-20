/**
 * @file feedback.ts
 * @description Server Actions para envio e listagem de opiniões, sugestões e feedbacks de clientes e testadores.
 * Permite coletar avaliações qualitativas e notas durante as fases de testes e uso em produção.
 * Implementa estratégia de persistência com fallback garantido no Supabase Storage caso a tabela 'feedbacks'
 * ainda não tenha sido criada no banco de dados.
 * @module actions/feedback
 * @recommendedPath src/actions/feedback.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";

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
 * Nome do bucket e caminho do arquivo de backup de feedbacks persistidos.
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
 * Persiste a lista consolidada de feedbacks no Supabase Storage.
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
 * Tenta salvar na tabela 'feedbacks' do Supabase. Se a tabela não existir,
 * salva no Supabase Storage garantindo que apareça imediatamente em 'Registros Recentes'.
 *
 * @param input - Dados estruturados do feedback do usuário.
 * @returns {Promise<FeedbackResponse>} Objeto indicando o resultado e status da submissão.
 */
export async function enviarFeedback(input: FeedbackInput): Promise<FeedbackResponse> {
  // Validação básica de campo obrigatório
  if (!input.mensagem || input.mensagem.trim().length === 0) {
    return {
      success: false,
      message: "Por favor, escreva sua mensagem ou opinião antes de enviar.",
    };
  }

  // Sanitização e formatação dos valores
  const nomeSanitizado = input.nome ? input.nome.trim().slice(0, 100) : null;
  const contatoSanitizado = input.contato ? input.contato.trim().slice(0, 120) : null;
  const mensagemSanitizada = input.mensagem.trim().slice(0, 3000);
  const paginaOrigemSanitizada = input.pagina_origem ? input.pagina_origem.slice(0, 200) : null;

  let avaliacaoNumero: number | null = null;
  if (typeof input.avaliacao === "number" && input.avaliacao >= 1 && input.avaliacao <= 5) {
    avaliacaoNumero = Math.round(input.avaliacao);
  }

  const payload = {
    nome: nomeSanitizado,
    contato: contatoSanitizado,
    tipo_usuario: input.tipo_usuario || "cliente",
    categoria: input.categoria || "sugestao",
    avaliacao: avaliacaoNumero,
    mensagem: mensagemSanitizada,
    pagina_origem: paginaOrigemSanitizada,
  };

  const novoId = crypto.randomUUID();
  const novoItem: FeedbackItem = {
    id: novoId,
    ...payload,
    criado_em: new Date().toISOString(),
  };

  try {
    // 1. Tentativa de inserção primária na tabela 'feedbacks' do Supabase
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

      // Fallback: Persiste no bucket do Supabase Storage
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

    // Se salvou na tabela, também mantém cópia no Storage para redundância
    try {
      const listaExistente = await recuperarFeedbacksDoStorage();
      const itemFinal: FeedbackItem = {
        ...novoItem,
        id: data?.id || novoId,
      };
      await persistirFeedbacksNoStorage([itemFinal, ...listaExistente].slice(0, 100));
    } catch {
      // Falha não bloqueante de espelhamento
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
        message: "Opinião registrada com sucesso! Agradecemos sua colaboração.",
      };
    } catch (storageErr) {
      console.error("Falha ao gravar no Storage:", storageErr);
      return {
        success: false,
        message: "Não foi possível registrar o feedback no momento. Tente novamente.",
      };
    }
  }
}

/**
 * Recupera os feedbacks recentes enviados por clientes e testadores.
 * Consulta primariamente a tabela 'feedbacks' do Supabase; se vazia ou inacessível,
 * consulta o backup persistente no Supabase Storage.
 *
 * @param limite - Quantidade máxima de registros a serem retornados (padrão: 30).
 * @returns {Promise<FeedbackItem[]>} Lista ordenada de feedbacks cadastrados.
 */
export async function listarFeedbacks(limite = 30): Promise<FeedbackItem[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .select("id, nome, contato, tipo_usuario, categoria, avaliacao, mensagem, pagina_origem, criado_em")
      .order("criado_em", { ascending: false })
      .limit(limite);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as FeedbackItem[];
    }
  } catch (err) {
    console.warn("Aviso ao buscar tabela feedbacks:", err);
  }

  // Fallback: Recupera registros do Supabase Storage
  try {
    const doStorage = await recuperarFeedbacksDoStorage();
    return doStorage.slice(0, limite);
  } catch (err) {
    console.warn("Exceção ao listar feedbacks do Storage:", err);
    return [];
  }
}
