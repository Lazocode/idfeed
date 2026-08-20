"use server";

import { supabaseAdmin, FOTOS_BUCKET } from "@/lib/supabase";
import { requireRole } from "@/lib/security";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_SIZE = 5 * 1024 * 1024;
type EntidadeFoto = "veiculo" | "material";

async function verificarPropriedade(entidadeTipo: EntidadeFoto, entidadeId: string, lojaId: string) {
  const tabela = entidadeTipo === "veiculo" ? "veiculos" : "materiais";
  const { data } = await supabaseAdmin.from(tabela).select("id").eq("id", entidadeId).eq("loja_id", lojaId).maybeSingle();
  return !!data;
}

export async function enviarFoto(entidadeTipo: EntidadeFoto, entidadeId: string, formData: FormData) {
  const session = await requireRole(["admin", "mecanico"]);
  if (!["veiculo", "material"].includes(entidadeTipo)) throw new Error("Tipo de entidade inválido.");
  if (!(await verificarPropriedade(entidadeTipo, entidadeId, session.user.lojaId))) throw new Error("Item não encontrado nesta loja.");

  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) throw new Error("Selecione uma foto.");
  if (arquivo.size > MAX_SIZE) throw new Error("A foto deve ter no máximo 5 MB.");
  const extensao = ALLOWED[arquivo.type];
  if (!extensao) throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");

  const caminho = `${entidadeTipo}/${entidadeId}/${crypto.randomUUID()}.${extensao}`;
  const buffer = Buffer.from(await arquivo.arrayBuffer());
  const { error: erroUpload } = await supabaseAdmin.storage.from(FOTOS_BUCKET).upload(caminho, buffer, {
    contentType: arquivo.type,
    upsert: false,
  });
  if (erroUpload) throw new Error("Falha ao enviar a foto.");

  const { error: dbError } = await supabaseAdmin.from("fotos").insert({
    entidade_tipo: entidadeTipo,
    entidade_id: entidadeId,
    url: caminho,
    enviado_por_usuario_id: session.user.id,
  });
  if (dbError) {
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([caminho]);
    throw new Error("Não foi possível registrar a foto.");
  }
  revalidatePath(`/loja/${entidadeTipo}/${entidadeId}`);
}

export async function removerFoto(fotoId: string, entidadeTipo: EntidadeFoto, entidadeId: string) {
  const session = await requireRole(["admin", "mecanico"]);
  if (!(await verificarPropriedade(entidadeTipo, entidadeId, session.user.lojaId))) throw new Error("Item não encontrado nesta loja.");

  const { data: foto } = await supabaseAdmin.from("fotos").select("id, url, entidade_id, entidade_tipo").eq("id", fotoId).eq("entidade_id", entidadeId).eq("entidade_tipo", entidadeTipo).maybeSingle();
  if (!foto) throw new Error("Foto não encontrada.");

  await supabaseAdmin.from("fotos").delete().eq("id", fotoId).eq("entidade_id", entidadeId).eq("entidade_tipo", entidadeTipo);
  try {
    const marker = `/storage/v1/object/public/${FOTOS_BUCKET}/`;
    const idx = foto.url.indexOf(marker);
    if (idx >= 0) await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([decodeURIComponent(foto.url.slice(idx + marker.length))]);
  } catch {}
  revalidatePath(`/loja/${entidadeTipo}/${entidadeId}`);
}
