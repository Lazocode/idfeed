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
