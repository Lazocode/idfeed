/**
 * @file supabase.ts
 * @description Instanciação e utilitários do cliente Supabase para o ambiente de servidor.
 * Utiliza credenciais de `service_role` com bypass de RLS para operações administrativas e controle de buckets.
 * @module lib/supabase
 * @recommendedPath src/lib/supabase.ts
 */

// 1. Dependências e bibliotecas externas
import { createClient } from "@supabase/supabase-js";

/**
 * URL da instância do Supabase recuperada das variáveis de ambiente.
 */
const supabaseUrl =
  process.env.SUPABASE_URL || "https://placeholder-project.supabase.co";

/**
 * Chave de Service Role do Supabase (restrita ao ambiente de servidor, nunca exposta ao cliente).
 */
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

/**
 * Cliente administrativo do Supabase para Server Actions e rotas de API.
 * Desativa a persistência de sessão de navegador já que o controle de autenticação é exercido pelo NextAuth.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { persistSession: false } }
);

/**
 * Nome padrão do bucket de armazenamento para imagens e fotos veiculares.
 */
export const FOTOS_BUCKET = "fotos";

/**
 * Assegura que um bucket de armazenamento do Supabase exista.
 * Utiliza as credenciais de service_role do `supabaseAdmin` para criar o bucket caso inexista.
 *
 * @param bucketName - Nome do bucket a ser verificado/criado.
 * @param isPublic - Se o bucket deve permitir acesso público sem assinatura (default: `false`).
 */
export async function ensureBucketExists(bucketName: string, isPublic = false): Promise<void> {
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

