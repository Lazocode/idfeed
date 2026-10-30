/**
 * @file movimentacoes.ts
 * @description Server Actions para controle de entradas, saídas e ajustes de saldo no estoque de peças.
 * Executa a procedure transacional `registrar_movimentacao` no banco de dados com validação anti-IDOR,
 * controle de concorrência otimista (prevenção de TOCTOU) e auditoria dos lançamentos.
 * @module actions/movimentacoes
 * @recommendedPath src/actions/movimentacoes.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 2. Serviços e utilitários internos
import { supabaseAdmin } from "@/lib/supabase";
import { requireApprovedAction } from "@/lib/security";
import { movementSchema, isValidUuid } from "@/lib/validation";

/**
 * Registra uma nova movimentação de estoque de forma atômica e defensiva.
 *
 * MITIGAÇÃO:
 * - IDOR & Multi-tenant Authorization: Valida UUID, exige aprovação ativa e isolamento por `loja_id` via `requireApprovedAction`.
 * - TOCTOU Race Condition & Estoque Negativo: Utiliza a procedure `registrar_movimentacao` com `p_loja_id` obrigatório e,
 *   no caso de ausência da procedure no banco (`PGRST202`), aplica trava de concorrência otimista (`eq("quantidade_atual", saldoAtual)`).
 * - Integer Overflow / Exploração Aritmética: Limita o quantitativo máximo por operação.
 *
 * @param materialId - UUID do material a ser movimentado.
 * @param formData - Dados contendo o tipo ('entrada' | 'saida' | 'transferencia' | 'inventario'), quantidade e observação.
 * @throws {Error} Se os dados forem inválidos, a quantidade for nula/negativa ou o material não pertencer à loja.
 * @returns {Promise<never>} Redireciona para a página do material com o saldo atualizado.
 */
export async function registrarMovimentacao(
  materialId: string,
  formData: FormData
): Promise<never> {
  // 1. Exige perfil operacional e loja homologada
  const session = await requireApprovedAction(["admin", "mecanico"]);

  if (!isValidUuid(materialId)) {
    throw new Error("Identificador de material inválido.");
  }

  // 2. Validação dos dados informados
  const parsed = movementSchema.safeParse({
    tipo: formData.get("tipo"),
    quantidade: formData.get("quantidade"),
    observacao: formData.get("observacao") ?? "",
  });

  if (!parsed.success) {
    throw new Error("Dados de movimentação de estoque inválidos.");
  }

  // 3. Verifica se o material pertence à oficina do usuário conectado e obtém saldo atual
  const { data: material } = await supabaseAdmin
    .from("materiais")
    .select("id, quantidade_atual, loja_id")
    .eq("id", materialId)
    .eq("loja_id", session.user.lojaId)
    .maybeSingle();

  if (!material) {
    throw new Error("Material não encontrado ou não pertence a esta oficina.");
  }

  const { tipo, quantidade, observacao } = parsed.data;

  if (quantidade <= 0 || quantidade > 1_000_000) {
    throw new Error(
      "Informe uma quantidade válida entre 1 e 1.000.000 unidades."
    );
  }

  const saldoAtual = Number(material.quantidade_atual ?? 0);

  // 4. MITIGAÇÃO: Impede saídas que deixariam o estoque fisicamente inconsistente (saldo negativo)
  if (tipo === "saida" && quantidade > saldoAtual) {
    throw new Error(
      `Saldo insuficiente em estoque. Saldo atual: ${saldoAtual}, tentativa de saída: ${quantidade}.`
    );
  }

  let delta = 0;

  // Define o delta algébrico para a rotina do banco (+ para entrada, - para saída, ajuste para inventário)
  if (tipo === "entrada") {
    delta = quantidade;
  } else if (tipo === "saida") {
    delta = -quantidade;
  } else if (tipo === "inventario") {
    // No ajuste de inventário, a quantidade informada é a contagem física aferida
    delta = quantidade - saldoAtual;
  } else if (tipo === "transferencia") {
    // Transferência física entre prateleiras/locais não altera o quantitativo absoluto
    delta = 0;
  }

  // 5. Executa a procedure com 6 parâmetros (assinatura segura com p_loja_id)
  const rpcResult = await supabaseAdmin.rpc("registrar_movimentacao", {
    p_material_id: materialId,
    p_tipo: tipo,
    p_delta: delta,
    p_responsavel_usuario_id: session.user.id,
    p_observacao: observacao || null,
    p_loja_id: session.user.lojaId,
  });

  // 6. Se a procedure retornar erro de regra de negócio/segurança do PostgreSQL, interrompe imediatamente
  if (rpcResult.error && rpcResult.error.code !== "PGRST202") {
    console.error("ERRO NA PROCEDURE registrar_movimentacao:", rpcResult.error);
    throw new Error(
      "Não foi possível registrar a movimentação de estoque. Verifique o saldo disponível."
    );
  }

  // 7. Fallback exclusivo caso a função RPC ainda não exista no schema cache (PGRST202), com trava otimista (CAS)
  if (rpcResult.error && rpcResult.error.code === "PGRST202") {
    if (delta !== 0) {
      const novoSaldo = saldoAtual + delta;
      if (novoSaldo < 0) {
        throw new Error("Saldo insuficiente em estoque para concluir a saída.");
      }

      // Atualização com Compare-And-Swap (CAS) sobre quantidade_atual para impedir condição de corrida (TOCTOU)
      const { data: atualizado, error: updateError } = await supabaseAdmin
        .from("materiais")
        .update({
          quantidade_atual: novoSaldo,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", materialId)
        .eq("loja_id", session.user.lojaId)
        .eq("quantidade_atual", saldoAtual)
        .select("id")
        .maybeSingle();

      if (updateError || !atualizado) {
        console.error("CONFLITO DE CONCORRÊNCIA OU ERRO AO ATUALIZAR SALDO:", updateError);
        throw new Error(
          "O saldo do material foi alterado simultaneamente por outra operação. Tente novamente."
        );
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from("movimentacoes_estoque")
      .insert({
        material_id: materialId,
        tipo,
        quantidade: delta,
        responsavel_usuario_id: session.user.id,
        observacao: observacao || null,
      });

    if (insertError) {
      console.error("ERRO AO INSERIR MOVIMENTAÇÃO:", insertError);
      throw new Error(
        "Não foi possível registrar a movimentação no histórico."
      );
    }
  }

  // Invalida o cache das páginas afetadas
  revalidatePath(`/loja/material/${materialId}`);
  revalidatePath("/loja/dashboard");
  revalidatePath("/loja/material");

  // Redireciona para a página do material
  redirect(`/loja/material/${materialId}`);
}

/**
 * Atualiza a observação descritiva de uma movimentação histórica de estoque com validação de posse.
 *
 * MITIGAÇÃO:
 * - IDOR: Valida UUIDs e verifica se o movimento pertence ao material da oficina autenticada antes de atualizar.
 * - Parameter Tampering: Impede qualquer alteração de tipo, quantidade ou saldo retroativo.
 *
 * @param movimentacaoId - UUID do registro de movimentação de estoque.
 * @param materialId - UUID do material associado.
 * @param formData - FormData contendo a nova observação.
 * @throws {Error} Se a observação ultrapassar 2000 caracteres ou o registro não for encontrado.
 * @returns {Promise<never>} Redireciona para a tela do material.
 */
export async function editarMovimentacao(
  movimentacaoId: string,
  materialId: string,
  formData: FormData
): Promise<never> {
  const session = await requireApprovedAction(["admin", "mecanico"]);

  if (!isValidUuid(movimentacaoId) || !isValidUuid(materialId)) {
    throw new Error("Identificadores inválidos.");
  }

  const observacao = String(formData.get("observacao") ?? "").trim();

  if (observacao.length > 2000) {
    throw new Error("Observação excede o limite de 2.000 caracteres.");
  }

  // Garante que o registro pertence à oficina atual (prevenção de IDOR)
  const { data: movimento } = await supabaseAdmin
    .from("movimentacoes_estoque")
    .select("id, material_id, materiais!inner(id, loja_id)")
    .eq("id", movimentacaoId)
    .eq("material_id", materialId)
    .eq("materiais.loja_id", session.user.lojaId)
    .maybeSingle();

  if (!movimento) {
    throw new Error("Movimentação não encontrada nesta oficina.");
  }

  const { error } = await supabaseAdmin
    .from("movimentacoes_estoque")
    .update({ observacao: observacao || null })
    .eq("id", movimentacaoId)
    .eq("material_id", materialId);

  if (error) {
    console.error("ERRO AO EDITAR MOVIMENTAÇÃO:", error);
    throw new Error("Não foi possível editar a observação da movimentação.");
  }

  revalidatePath(`/loja/material/${materialId}`);

  redirect(`/loja/material/${materialId}`);
}
