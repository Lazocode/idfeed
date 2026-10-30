/**
 * @file photos.ts
 * @description Utilitário para resolução segura de URLs de fotos veiculares e anexos.
 * Gera URLs temporárias assinadas (Signed URLs) via Supabase Storage para buckets privados,
 * bloqueando caminhos com transversão de diretório ou URLs relativas de protocolo (`//`).
 * @module lib/photos
 * @recommendedPath src/lib/photos.ts
 */

// 1. Bibliotecas e serviços internos
import { supabaseAdmin, FOTOS_BUCKET } from "@/lib/supabase";

/**
 * Resolve o caminho de uma foto armazenada no Supabase Storage para uma URL assinada temporária.
 *
 * MITIGAÇÃO:
 * - Prevenção de Path Traversal e Protocol-Relative URL Injection (`//evil.com`).
 * - Exclusão de fallback para URL pública aberta em bucket privado.
 *
 * @param path - Caminho relativo do arquivo no bucket (ex: "veiculo/id/foto.jpg") ou URL segura.
 * @returns Promessa com a URL assinada válida por 1 hora ou string vazia em caso de falha/caminho inválido.
 */
export async function getSignedPhotoUrl(path: string): Promise<string> {
  if (!path || typeof path !== "string") return "";

  const cleanPath = path.trim();
  if (!cleanPath || cleanPath.includes("..") || cleanPath.includes("\\")) {
    return "";
  }

  // Permite apenas caminhos estáticos locais legítimos (não iniciados por //) ou HTTPS explícito
  if (cleanPath.startsWith("/") && !cleanPath.startsWith("//")) {
    return cleanPath;
  }
  if (cleanPath.startsWith("https://")) {
    return cleanPath;
  }

  // Rejeita esquemas arbitrários (http:, javascript:, data:, etc.)
  if (cleanPath.includes(":")) {
    return "";
  }

  try {
    // Gera Signed URL com expiração de 3600 segundos (1 hora) para o bucket privado
    const { data, error } = await supabaseAdmin.storage
      .from(FOTOS_BUCKET)
      .createSignedUrl(cleanPath, 3600);

    if (error || !data?.signedUrl) {
      return "";
    }

    return data.signedUrl;
  } catch (err) {
    console.warn("Erro ao obter URL assinada da foto:", err);
    return "";
  }
}
