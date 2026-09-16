import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

// Client de servidor — usa a service role key, que NUNCA deve ser exposta ao navegador.
// Só é importado dentro de Server Actions/Route Handlers.
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { persistSession: false } }
);

export const FOTOS_BUCKET = "fotos";

/**
 * Assegura que um bucket de armazenamento do Supabase exista.
 * Utiliza as credenciais de service_role do supabaseAdmin para criar se necessário.
 */
export async function ensureBucketExists(bucketName: string, isPublic = false) {
  try {
    const { data: bucket, error } = await supabaseAdmin.storage.getBucket(bucketName);
    if (!bucket || error) {
      const { error: createErr } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 15 * 1024 * 1024,
      });
      if (createErr && !createErr.message?.toLowerCase().includes("already exists")) {
        console.warn(`Tentativa de criação do bucket "${bucketName}":`, createErr.message);
      }
    }
  } catch (err) {
    console.warn(`Aviso ao verificar/criar bucket "${bucketName}":`, err);
  }
}
