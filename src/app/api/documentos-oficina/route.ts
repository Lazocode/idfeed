import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "node:crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.lojaId) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const lojaId = session.user.lojaId;

    // Tipo do arquivo enviado
    const contentType = request.headers.get("content-type");

    if (!contentType || !ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Formato de documento não permitido." },
        { status: 400 }
      );
    }

    // Nome original do arquivo
    const encodedFileName = request.headers.get("x-file-name");

    const nomeOriginal = encodedFileName
      ? decodeURIComponent(encodedFileName).slice(0, 255)
      : "documento";

    // Lê o arquivo diretamente do corpo da requisição
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

    // Confirma que a oficina existe e está pendente
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

    // Evita múltiplos documentos pendentes
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

    // Define extensão
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

    // Upload para o Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("documentos-oficinas")
      .upload(caminhoArquivo, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("ERRO NO UPLOAD:", uploadError);

      return NextResponse.json(
        { error: "Não foi possível enviar o documento." },
        { status: 500 }
      );
    }

    // Registra documento no banco
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

      // Remove o arquivo caso o banco falhe
      await supabaseAdmin.storage
        .from("documentos-oficinas")
        .remove([caminhoArquivo]);

      return NextResponse.json(
        { error: "Não foi possível registrar o documento." },
        { status: 500 }
      );
    }

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