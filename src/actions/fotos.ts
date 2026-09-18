/**
 * @file fotos.ts
 * @description Server Actions para upload e exclusão segura de fotos e anexos (veículos e materiais).
 * Garante autorização baseada em funções (RBAC), validação MIME, integridade de storage e limpeza de referências.
 * @module actions/fotos
 * @recommendedPath src/actions/fotos.ts
 */

"use server";

// 1. Dependências e bibliotecas externas
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";

// 2. Serviços e utilitários internos
import { supabaseAdmin, FOTOS_BUCKET, ensureBucketExists } from "@/lib/supabase";
import { requireRole } from "@/lib/security";

/**
 * Tipos MIME de imagem permitidos e suas extensões correspondentes.
 */
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Tamanho máximo permitido para upload: 10 megabytes. */
const MAX_SIZE = 10 * 1024 * 1024;

/** Entidades do domínio aptas a receber anexos fotográficos. */
export type EntidadeFoto = "veiculo" | "material";

/**
 * Verifica se a entidade especificada pertence à oficina conectada do usuário autenticado.
 *
 * @param entidadeTipo - Tipo da entidade ('veiculo' | 'material').
 * @param entidadeId - UUID da entidade.
 * @param lojaId - UUID da oficina do usuário logado.
 * @returns Retorna verdadeiro se a entidade pertencer à oficina.
 */
async function verificarPropriedade(
  entidadeTipo: EntidadeFoto,
  entidadeId: string,
  lojaId: string
): Promise<boolean> {
  const tabela = entidadeTipo === "veiculo" ? "veiculos" : "materiais";
  const { data } = await supabaseAdmin
    .from(tabela)
    .select("id")
    .eq("id", entidadeId)
    .eq("loja_id", lojaId)
    .maybeSingle();

  return !!data;
}

/**
 * Realiza o upload de uma foto anexada a um veículo ou material de estoque.
 *
 * @param entidadeTipo - Categoria da entidade ('veiculo' | 'material').
 * @param entidadeId - Identificador único do veículo ou material.
 * @param formData - FormData contendo o arquivo de imagem no campo 'foto'.
 * @throws {Error} Se o arquivo for inválido, ultrapassar o tamanho ou ocorrer erro no bucket.
 * @returns {Promise<void>}
 */
export async function enviarFoto(
  entidadeTipo: EntidadeFoto,
  entidadeId: string,
  formData: FormData
): Promise<void> {
  const session = await requireRole(["admin", "mecanico"]);

  if (!["veiculo", "material"].includes(entidadeTipo)) {
    throw new Error("Tipo de entidade inválido.");
  }

  const pertence = await verificarPropriedade(
    entidadeTipo,
    entidadeId,
    session.user.lojaId
  );

  if (!pertence) {
    throw new Error("Item não encontrado nesta oficina.");
  }

  const arquivo = formData.get("foto");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione um arquivo de foto.");
  }

  if (arquivo.size > MAX_SIZE) {
    throw new Error("A foto deve ter no máximo 10 MB.");
  }

  const extensao = ALLOWED[arquivo.type];

  if (!extensao) {
    throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  }

  // Assegura que o bucket 'fotos' existe no Supabase Storage
  await ensureBucketExists(FOTOS_BUCKET, false);

  const caminho = `${entidadeTipo}/${entidadeId}/${crypto.randomUUID()}.${extensao}`;
  const buffer = Buffer.from(await arquivo.arrayBuffer());

  let { error: erroUpload } = await supabaseAdmin.storage
    .from(FOTOS_BUCKET)
    .upload(caminho, buffer, {
      contentType: arquivo.type,
      upsert: true,
    });

  // Se der erro de bucket inexistente (404), tenta provisionar o bucket e reenviar
  if (erroUpload) {
    console.warn("Aviso no upload inicial para Supabase Storage:", erroUpload);
    const msg = erroUpload.message?.toLowerCase() || "";
    if (
      msg.includes("not found") ||
      msg.includes("bucket") ||
      (erroUpload as unknown as { statusCode?: string | number }).statusCode === "404" ||
      (erroUpload as unknown as { status?: number }).status === 404
    ) {
      console.log(`Criando bucket "${FOTOS_BUCKET}" automaticamente...`);
      try {
        await supabaseAdmin.storage.createBucket(FOTOS_BUCKET, {
          public: false,
          fileSizeLimit: 15 * 1024 * 1024,
        });

        const retry = await supabaseAdmin.storage.from(FOTOS_BUCKET).upload(caminho, buffer, {
          contentType: arquivo.type,
          upsert: true,
        });
        erroUpload = retry.error;
      } catch (createErr) {
        console.error("Falha ao tentar criar bucket 'fotos':", createErr);
      }
    }
  }

  if (erroUpload) {
    console.error("Erro definitivo no upload da foto:", erroUpload);
    throw new Error(
      `Falha ao enviar a foto: ${erroUpload.message || "Verifique se o bucket 'fotos' existe no Supabase Storage."}`
    );
  }

  // Registra os metadados da foto na tabela do banco
  const { error: dbError } = await supabaseAdmin.from("fotos").insert({
    entidade_tipo: entidadeTipo,
    entidade_id: entidadeId,
    url: caminho,
    enviado_por_usuario_id: session.user.id,
  });

  if (dbError) {
    console.error("Erro ao registrar foto no banco de dados:", dbError);
    // Limpeza de segurança: remove o arquivo do storage
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([caminho]);
    throw new Error(`Não foi possível registrar a foto: ${dbError.message}`);
  }

  revalidatePath(`/loja/${entidadeTipo}/${entidadeId}`);
}

/**
 * Remove uma foto cadastrada do banco de dados e do bucket de armazenamento.
 *
 * @param fotoId - UUID da foto.
 * @param entidadeTipo - Categoria da entidade ('veiculo' | 'material').
 * @param entidadeId - UUID da entidade vinculada.
 * @throws {Error} Se a foto não pertencer à loja do usuário.
 * @returns {Promise<void>}
 */
export async function removerFoto(
  fotoId: string,
  entidadeTipo: EntidadeFoto,
  entidadeId: string
): Promise<void> {
  const session = await requireRole(["admin", "mecanico"]);

  const pertence = await verificarPropriedade(
    entidadeTipo,
    entidadeId,
    session.user.lojaId
  );

  if (!pertence) {
    throw new Error("Item não encontrado nesta oficina.");
  }

  const { data: foto } = await supabaseAdmin
    .from("fotos")
    .select("id, url, entidade_id, entidade_tipo")
    .eq("id", fotoId)
    .eq("entidade_id", entidadeId)
    .eq("entidade_tipo", entidadeTipo)
    .maybeSingle();

  if (!foto) {
    throw new Error("Foto não encontrada.");
  }

  // Remove o registro do banco
  await supabaseAdmin
    .from("fotos")
    .delete()
    .eq("id", fotoId)
    .eq("entidade_id", entidadeId)
    .eq("entidade_tipo", entidadeTipo);

  // Remove o arquivo físico do Supabase Storage
  try {
    const marker = `/storage/v1/object/public/${FOTOS_BUCKET}/`;
    const idx = foto.url.indexOf(marker);

    if (idx >= 0) {
      await supabaseAdmin.storage
        .from(FOTOS_BUCKET)
        .remove([decodeURIComponent(foto.url.slice(idx + marker.length))]);
    } else {
      await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([foto.url]);
    }
  } catch (err) {
    console.warn("Aviso ao remover foto do storage:", err);
  }

  revalidatePath(`/loja/${entidadeTipo}/${entidadeId}`);
}

