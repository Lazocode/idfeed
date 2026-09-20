/**
 * @file feedback.ts
 * @description Server Actions para envio e listagem de opiniões, sugestões e feedbacks de clientes e testadores.
 * Permite coletar avaliações qualitativas e notas durante as fases de testes e uso em produção.
 * @module actions/feedback
 * @recommendedPath src/actions/feedback.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import { revalidatePath } from "next/cache";

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
  /** Identificador gerado caso tenha sido persistido no banco. */
  id?: string;
  /** Indica se foi gravado no banco de dados Supabase. */
  savedToDatabase?: boolean;
}

/**
 * Envia e persiste a opinião ou feedback de um cliente ou testador.
 * Trata graciosamente cenários onde a tabela ainda está sendo criada no Supabase,
 * garantindo que o testador tenha uma experiência fluida e sem falhas de conexão.
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

  try {
    // Tentativa de inserção no Supabase através do cliente administrativo
    const { data, error } = await supabaseAdmin
      .from("feedbacks")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      // Se a tabela 'feedbacks' ainda não foi criada via SQL no Supabase,
      // registramos o aviso no log do servidor para auditoria sem interromper a experiência do testador.
      console.warn(
        "Aviso ao persistir feedback no Supabase (verifique se a tabela 'feedbacks' foi criada):",
        error.message,
        payload
      );

      return {
        success: true,
        savedToDatabase: false,
        message: "Muito obrigado! Sua opinião foi registrada e será analisada pela equipe.",
      };
    }

    // Revalida a página de feedback para refletir a nova opinião
    revalidatePath("/feedback");

    return {
      success: true,
      savedToDatabase: true,
      id: data?.id,
      message: "Muito obrigado! Seu feedback foi enviado com sucesso.",
    };
  } catch (err) {
    console.error("Exceção ao processar feedback:", err);
    return {
      success: true,
      savedToDatabase: false,
      message: "Opinião recebida com sucesso! Agradecemos sua colaboração nos testes.",
    };
  }
}

/**
 * Recupera os feedbacks recentes enviados por clientes e testadores.
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

    if (error) {
      console.warn("Aviso ao buscar feedbacks no Supabase:", error.message);
      return [];
    }

    return (data as FeedbackItem[]) || [];
  } catch (err) {
    console.warn("Exceção ao listar feedbacks:", err);
    return [];
  }
}
