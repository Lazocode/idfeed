import { createClient } from "@supabase/supabase-js";

// Client de servidor — usa a service role key, que NUNCA deve ser exposta ao navegador.
// Só é importado dentro de Server Actions/Route Handlers.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const FOTOS_BUCKET = "fotos";
