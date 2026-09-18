/**
 * @file photos.ts
 * @description Utilitário para resolução de URLs de fotos veiculares e anexos.
 * Gera URLs temporárias assinadas (Signed URLs) via Supabase Storage para buckets privados,
 * com fallback para URLs públicas quando aplicável.
 * @module lib/photos
 * @recommendedPath src/lib/photos.ts
 */

// 1. Bibliotecas e serviços internos
import { supabaseAdmin, FOTOS_BUCKET } from "@/lib/supabase";

/**
 * Resolve o caminho de uma foto armazenada no Supabase Storage para uma URL acessível.
 *
 * @param path - Caminho relativo do arquivo no bucket (ex: "loja-id/veiculo-id/foto.jpg") ou URL absoluta.
 * @returns Promessa com a URL assinada válida por 1 hora, URL pública ou string vazia em caso de falha.
 */
export async function getSignedPhotoUrl(path: string): Promise<string> {
  // Se o caminho for vazio, retorna vazio imediatamente
  if (!path) return "";

  // Se já for uma URL absoluta (HTTP/HTTPS) ou estática local (/), retorna diretamente
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }

  try {
    // Tenta gerar Signed URL com expiração de 3600 segundos (1 hora)
    const { data, error } = await supabaseAdmin.storage
      .from(FOTOS_BUCKET)
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      // Fallback para URL pública caso o bucket seja público ou a assinatura falhe
      const { data: pub } = supabaseAdmin.storage.from(FOTOS_BUCKET).getPublicUrl(path);
      return pub?.publicUrl ?? "";
    }

    return data.signedUrl;
  } catch (err) {
    console.warn("Erro ao obter URL assinada da foto:", err);
    return "";
  }
}

