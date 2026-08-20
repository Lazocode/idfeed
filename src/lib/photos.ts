import { supabaseAdmin, FOTOS_BUCKET } from "@/lib/supabase";
export async function getSignedPhotoUrl(path: string) {
  const { data } = await supabaseAdmin.storage.from(FOTOS_BUCKET).createSignedUrl(path, 300);
  return data?.signedUrl ?? "";
}
