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

/**
 * Define o runtime do Node.js para suporte a operações de Buffer e criptografia nativa.
 */
export const runtime = "nodejs";

/**
 * Limite máximo em bytes para o tamanho do documento (5 MB).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
 * Processa a requisição POST para envio de documento da oficina mecânica.
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
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const lojaId = session.user.lojaId;

    // 2. Validação do formato MIME do arquivo
    const contentType = request.headers.get("content-type");

    if (!contentType || !ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Formato de documento não permitido." },
        { status: 400 }
      );
    }

    // 3. Captura e sanitização do nome original do arquivo
    const encodedFileName = request.headers.get("x-file-name");
    const nomeOriginal = encodedFileName
      ? decodeURIComponent(encodedFileName).slice(0, 255)
      : "documento";

    // 4. Leitura do arrayBuffer e conversão em Buffer binário
    const buffer = Buffer.from(await request.arrayBuffer());

    if (buffer.length <= 0) {
      return NextResponse.json(
        { error: "O documento está vazio." },
        { status: 400 }
      );
    }

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "O documento deve ter no máximo 5 MB." },
        { status: 400 }
      );
    }

    // 5. Confirma se a oficina existe e se ainda necessita de análise cadastral
    const { data: loja, error: lojaError } = await supabaseAdmin
      .from("lojas")
      .select("id, status")
      .eq("id", lojaId)
      .maybeSingle();

    if (lojaError || !loja) {
      return NextResponse.json(
        { error: "Oficina não encontrada." },
        { status: 404 }
      );
    }

    if (loja.status === "aprovada") {
      return NextResponse.json(
        { error: "Esta oficina já está aprovada." },
        { status: 400 }
      );
    }

    // 6. Impede duplicidade de documentos com status pendente para a mesma oficina
    const { data: documentoExistente } = await supabaseAdmin
      .from("documentos_oficina")
      .select("id")
      .eq("loja_id", lojaId)
      .eq("status", "pendente")
      .maybeSingle();

    if (documentoExistente) {
      return NextResponse.json(
        { error: "Já existe um documento aguardando análise." },
        { status: 409 }
      );
    }

    // 7. Determina a extensão normalizada do arquivo
    const extensao =
      contentType === "application/pdf"
        ? "pdf"
        : contentType === "image/png"
          ? "png"
          : contentType === "image/webp"
            ? "webp"
            : "jpg";

    const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;
    const caminhoArquivo = `${lojaId}/${nomeArquivo}`;

    // 8. Garante que o bucket privado de documentos exista no Supabase Storage
    await ensureBucketExists("documentos-oficinas", false);

    // 9. Envio do arquivo para o bucket de armazenamento
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
      console.error("ERRO NO UPLOAD:", uploadError);

      return NextResponse.json(
        { error: `Não foi possível enviar o documento: ${uploadError.message || "Erro no armazenamento."}` },
        { status: 500 }
      );
    }

    // 10. Persistência do registro do documento na tabela `documentos_oficina`
    const { error: documentoError } = await supabaseAdmin
      .from("documentos_oficina")
      .insert({
        loja_id: lojaId,
        nome_arquivo: nomeOriginal,
        caminho_arquivo: caminhoArquivo,
        status: "pendente",
      });

    if (documentoError) {
      console.error(
        "ERRO AO REGISTRAR DOCUMENTO:",
        documentoError
      );

      // Rollback do arquivo no Storage em caso de erro no banco
      await supabaseAdmin.storage
        .from("documentos-oficinas")
        .remove([caminhoArquivo]);

      return NextResponse.json(
        { error: "Não foi possível registrar o documento." },
        { status: 500 }
      );
    }

    // 11. Se a loja havia sido rejeitada anteriormente, seu status volta para 'pendente'
    if (loja.status === "rejeitada") {
      const { error: atualizarLojaError } = await supabaseAdmin
        .from("lojas")
        .update({
          status: "pendente",
        })
        .eq("id", lojaId);

      if (atualizarLojaError) {
        console.error(
          "ERRO AO ATUALIZAR STATUS DA OFICINA:",
          atualizarLojaError
        );

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
          { error: "Não foi possível reenviar o documento." },
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
      { error: "Erro inesperado ao enviar o documento." },
      { status: 500 }
    );
  }
}
