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
import { requireApprovedAction } from "@/lib/security";
import { validateImageMagicBytes } from "@/lib/validation";
import { checkUploadRateLimit } from "@/lib/rate-limit";

/**
 * Tipos MIME de imagem permitidos e suas extensões correspondentes.
 */
const ALLOWED_MIME: Record<string, string> = {
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
 * Realiza o upload de uma foto anexada a um veículo ou material de estoque com validação defensiva.
 *
 * MITIGAÇÃO:
 * - Upload Bypass & Stored XSS: Inspeciona a assinatura binária real (Magic Bytes) dos bytes do arquivo.
 * - IDOR / Multi-tenant: Valida autorização da oficina e status aprovado via requireApprovedAction.
 * - DoS de Armazenamento: Aplica limitação de taxa por oficina via checkUploadRateLimit.
 * - Information Leakage: Oculta detalhes de infraestrutura e mensagens internas do Supabase.
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
  // 1. Autorização estrita e verificação de oficina homologada
  const session = await requireApprovedAction(["admin", "mecanico"]);

  // 2. Proteção contra DoS de armazenamento
  if (!checkUploadRateLimit(`upload:loja:${session.user.lojaId}`)) {
    throw new Error("Limite de uploads temporariamente atingido. Aguarde alguns minutos.");
  }

  if (!["veiculo", "material"].includes(entidadeTipo)) {
    throw new Error("Tipo de entidade inválido.");
  }

  // 3. Validação anti-IDOR da entidade
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

  // 4. Validação inicial de MIME Type declarado
  if (!ALLOWED_MIME[arquivo.type]) {
    throw new Error("Formato não suportado. Utilize imagens JPG, PNG ou WEBP.");
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());

  // 5. MITIGAÇÃO CRÍTICA: Validação de Magic Bytes / Assinatura Binária Real
  // Impede que arquivos maliciosos (.php, .html com XSS, .exe) sejam enviados com Content-Type falso
  const extensaoDetectada = validateImageMagicBytes(buffer);

  if (!extensaoDetectada) {
    throw new Error("Arquivo corrompido ou formato binário incompatível com imagem válida.");
  }

  // Assegura que o bucket 'fotos' existe no Supabase Storage
  await ensureBucketExists(FOTOS_BUCKET, false);

  const caminho = `${entidadeTipo}/${entidadeId}/${crypto.randomUUID()}.${extensaoDetectada}`;

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
    console.error("Erro no upload da foto:", erroUpload);
    throw new Error("Não foi possível salvar a imagem no momento. Tente novamente.");
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
    throw new Error("Não foi possível salvar o registro da foto.");
  }

  revalidatePath(`/loja/${entidadeTipo}/${entidadeId}`);
}

/**
 * Remove uma foto cadastrada do banco de dados e do bucket de armazenamento.
 *
 * MITIGAÇÃO:
 * - IDOR: Verifica se o recurso e a entidade pertencem exclusivamente à oficina autenticada.
 * - Path Traversal em Storage: Limita a remoção estritamente ao diretório do tenant e entidade.
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
  const session = await requireApprovedAction(["admin", "mecanico"]);

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
    const rawPath = idx >= 0 ? decodeURIComponent(foto.url.slice(idx + marker.length)) : foto.url;

    // Garante que o caminho não contenha transversão de diretórios
    if (!rawPath.includes("..") && rawPath.startsWith(`${entidadeTipo}/${entidadeId}/`)) {
      await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([rawPath]);
    }
  } catch (err) {
    console.warn("Aviso ao remover foto do storage:", err);
  }

  revalidatePath(`/loja/${entidadeTipo}/${entidadeId}`);
}


