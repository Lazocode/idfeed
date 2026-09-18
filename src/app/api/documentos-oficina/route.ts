/**
 * @file route.ts
 * @description Endpoint de API para upload de documentos comprobatórios de oficinas mecânicas.
 * Valida formatos permitidos (PDF, JPEG, PNG, WEBP), limite de tamanho (5 MB), status cadastral da loja,
 * realiza armazenamento seguro em bucket do Supabase Storage e registra o documento no banco de dados.
 * @module app/api/documentos-oficina/route
 * @recommendedPath src/app/api/documentos-oficina/route.ts
 */

// 1. Dependências e bibliotecas externas
import { NextResponse } from "next/server";
import crypto from "node:crypto";

// 2. Bibliotecas e serviços internos
import { auth } from "@/lib/auth";
import { supabaseAdmin, ensureBucketExists } from "@/lib/supabase";
import { validateDocumentMagicBytes, sanitizeFileName } from "@/lib/validation";
import { checkUploadRateLimit } from "@/lib/rate-limit";

/**
 * Define o runtime do Node.js para suporte a operações de Buffer e criptografia nativa.
 */
export const runtime = "nodejs";

/**
 * Limite máximo em bytes para o tamanho do documento (10 MB).
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Conjunto de MIME types suportados para envio de documentos.
 */
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Processa a requisição POST para envio de documento da oficina mecânica com validação defensiva.
 *
 * MITIGAÇÃO:
 * - Upload Bypass & Web Shell: Valida assinatura binária (Magic Bytes) de PDFs e imagens.
 * - Stored XSS & Path Traversal: Sanitiza o nome original vindo de headers (x-file-name).
 * - Storage Exhaustion DoS: Limita a frequência de uploads por oficina.
 * - Multi-tenant Isolation: Força o armazenamento em pasta exclusiva do tenant (`${lojaId}/`).
 * - Information Leakage: Omite detalhes de erro de storage ou infraestrutura na resposta HTTP.
 *
 * @param request - Objeto `Request` nativo contendo os headers `content-type`, `x-file-name` e o buffer binário no corpo.
 * @returns Resposta JSON com status de sucesso ou mensagem de erro formatada.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();

    // 1. Validação de autenticação da sessão e posse do tenant (loja)
    if (!session?.user?.id || !session.user.lojaId) {
      return NextResponse.json(
        { error: "Sessão inválida ou não autenticada." },
        { status: 401 }
      );
    }

    const lojaId = session.user.lojaId;

    // 2. Limitação de taxa de uploads por oficina
    if (!checkUploadRateLimit(`upload:documento:${lojaId}`)) {
      return NextResponse.json(
        { error: "Limite de envios atingido. Aguarde alguns minutos antes de tentar novamente." },
        { status: 429 }
      );
    }

    // 3. Validação do formato MIME do arquivo declarado
    const contentType = request.headers.get("content-type");

    if (!contentType || !ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Formato de documento não suportado. Aceitos: PDF, JPEG, PNG ou WEBP." },
        { status: 400 }
      );
    }

    // 4. Captura e sanitização estrita do nome original do arquivo
    const rawFileName = request.headers.get("x-file-name");
    let decodedName = "documento";
    if (rawFileName) {
      try {
        decodedName = decodeURIComponent(rawFileName);
      } catch {
        decodedName = rawFileName;
      }
    }
    const nomeOriginal = sanitizeFileName(decodedName);

    // 5. Leitura do arrayBuffer e conversão em Buffer binário
    const buffer = Buffer.from(await request.arrayBuffer());

    if (buffer.length <= 0) {
      return NextResponse.json(
        { error: "O documento enviado está vazio." },
        { status: 400 }
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "O documento deve ter no máximo 5 MB." },
        { status: 400 }
      );
    }

    // 6. MITIGAÇÃO CRÍTICA: Inspeção de Magic Bytes do cabeçalho binário
    const formatoDetectado = validateDocumentMagicBytes(buffer);

    if (!formatoDetectado) {
      return NextResponse.json(
        { error: "O arquivo enviado não possui assinatura binária válida para PDF ou imagem." },
        { status: 400 }
      );
    }

    // Garante coerência entre formato detectado e tipo declarado
    if (
      (formatoDetectado === "pdf" && contentType !== "application/pdf") ||
      (formatoDetectado !== "pdf" && contentType === "application/pdf")
    ) {
      return NextResponse.json(
        { error: "Inconsistência entre a extensão declarada e o conteúdo real do arquivo." },
        { status: 400 }
      );
    }

    // 7. Confirma se a oficina existe e se ainda necessita de análise cadastral
    const { data: loja, error: lojaError } = await supabaseAdmin
      .from("lojas")
      .select("id, status")
      .eq("id", lojaId)
      .maybeSingle();

    if (lojaError || !loja) {
      return NextResponse.json(
        { error: "Oficina não encontrada no cadastro." },
        { status: 404 }
      );
    }

    if (loja.status === "aprovada") {
      return NextResponse.json(
        { error: "Esta oficina já se encontra homologada na plataforma." },
        { status: 400 }
      );
    }

    // 8. Se já houver um documento com status 'pendente', substitui de forma segura
    const { data: documentoExistente } = await supabaseAdmin
      .from("documentos_oficina")
      .select("id, caminho_arquivo")
      .eq("loja_id", lojaId)
      .eq("status", "pendente")
      .maybeSingle();

    if (documentoExistente) {
      // Remove o arquivo físico anterior do storage
      try {
        await supabaseAdmin.storage
          .from("documentos-oficinas")
          .remove([documentoExistente.caminho_arquivo]);
      } catch (errRemocao) {
        console.warn("Aviso ao remover documento anterior do storage:", errRemocao);
      }

      // Remove o registro anterior do banco para dar lugar ao novo documento
      await supabaseAdmin
        .from("documentos_oficina")
        .delete()
        .eq("id", documentoExistente.id);
    }

    // 9. Nome de arquivo randômico não previsível
    const nomeArquivo = `${crypto.randomUUID()}.${formatoDetectado}`;
    const caminhoArquivo = `${lojaId}/${nomeArquivo}`;

    // 10. Garante que o bucket privado de documentos exista no Supabase Storage
    await ensureBucketExists("documentos-oficinas", false);

    // 11. Envio do arquivo para o bucket de armazenamento
    let { error: uploadError } = await supabaseAdmin.storage
      .from("documentos-oficinas")
      .upload(caminhoArquivo, buffer, {
        contentType,
        upsert: true,
      });

    // Fallback defensivo em caso de bucket não inicializado
    if (uploadError) {
      console.warn("Aviso no upload para documentos-oficinas:", uploadError);
      const msg = uploadError.message?.toLowerCase() || "";
      if (
        msg.includes("not found") ||
        msg.includes("bucket") ||
        (uploadError as unknown as { statusCode?: string | number }).statusCode === "404"
      ) {
        try {
          await supabaseAdmin.storage.createBucket("documentos-oficinas", {
            public: false,
            fileSizeLimit: 15 * 1024 * 1024,
          });
          const retry = await supabaseAdmin.storage
            .from("documentos-oficinas")
            .upload(caminhoArquivo, buffer, {
              contentType,
              upsert: true,
            });
          uploadError = retry.error;
        } catch (bErr) {
          console.error("Falha ao criar bucket documentos-oficinas:", bErr);
        }
      }
    }

    if (uploadError) {
      console.error("ERRO NO UPLOAD DO DOCUMENTO:", uploadError);

      return NextResponse.json(
        { error: "Falha no armazenamento do documento. Tente novamente." },
        { status: 500 }
      );
    }

    // 12. Persistência do registro do documento na tabela `documentos_oficina`
    const { error: documentoError } = await supabaseAdmin
      .from("documentos_oficina")
      .insert({
        loja_id: lojaId,
        nome_arquivo: nomeOriginal,
        caminho_arquivo: caminhoArquivo,
        status: "pendente",
      });

    if (documentoError) {
      console.error("ERRO AO REGISTRAR DOCUMENTO:", documentoError);

      // Rollback do arquivo no Storage em caso de erro no banco
      await supabaseAdmin.storage
        .from("documentos-oficinas")
        .remove([caminhoArquivo]);

      return NextResponse.json(
        { error: "Não foi possível salvar o registro do documento." },
        { status: 500 }
      );
    }

    // 13. Se a loja havia sido rejeitada anteriormente, seu status volta para 'pendente'
    if (loja.status === "rejeitada") {
      const { error: atualizarLojaError } = await supabaseAdmin
        .from("lojas")
        .update({
          status: "pendente",
        })
        .eq("id", lojaId);

      if (atualizarLojaError) {
        console.error("ERRO AO ATUALIZAR STATUS DA OFICINA:", atualizarLojaError);

        // Desfaz inserções
        await supabaseAdmin
          .from("documentos_oficina")
          .delete()
          .eq("loja_id", lojaId)
          .eq("caminho_arquivo", caminhoArquivo);

        await supabaseAdmin.storage
          .from("documentos-oficinas")
          .remove([caminhoArquivo]);

        return NextResponse.json(
          { error: "Não foi possível atualizar o status da oficina." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("ERRO NO ENVIO DO DOCUMENTO:", error);

    return NextResponse.json(
      { error: "Erro interno no processamento do documento." },
      { status: 500 }
    );
  }
}

