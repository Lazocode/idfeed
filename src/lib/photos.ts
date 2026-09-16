import { supabaseAdmin, FOTOS_BUCKET } from "@/lib/supabase";

export async function getSignedPhotoUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(FOTOS_BUCKET)
      .createSignedUrl(path, 3600); // 1 hora de validade
    if (error || !data?.signedUrl) {
      const { data: pub } = supabaseAdmin.storage.from(FOTOS_BUCKET).getPublicUrl(path);
      return pub?.publicUrl ?? "";
    }
    return data.signedUrl;
  } catch (err) {
    console.warn("Erro ao obter URL assinada da foto:", err);
    return "";
  }
}
