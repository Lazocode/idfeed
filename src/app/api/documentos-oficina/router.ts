import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "node:crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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

    const formData = await request.formData();
    const arquivo = formData.get("documento");

    if (!(arquivo instanceof File)) {
      return NextResponse.json(
        { error: "Nenhum documento foi enviado." },
        { status: 400 }
      );
    }

    if (arquivo.size <= 0) {
      return NextResponse.json(
        { error: "O documento está vazio." },
        { status: 400 }
      );
    }

    if (arquivo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "O documento deve ter no máximo 5 MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(arquivo.type)) {
      return NextResponse.json(
        { error: "Formato de documento não permitido." },
        { status: 400 }
      );
    }

    // Confirma que a oficina existe e ainda está pendente.
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

    if (loja.status !== "pendente") {
      return NextResponse.json(
        { error: "Esta oficina não está aguardando documento." },
        { status: 400 }
      );
    }

    // Evita múltiplos documentos pendentes para a mesma oficina.
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

    const extensao =
      arquivo.type === "application/pdf"
        ? "pdf"
        : arquivo.type === "image/png"
          ? "png"
          : arquivo.type === "image/webp"
            ? "webp"
            : "jpg";

    const nomeArquivo = `${crypto.randomUUID()}.${extensao}`;
    const caminhoArquivo = `${lojaId}/${nomeArquivo}`;

    const buffer = Buffer.from(await arquivo.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documentos-oficinas")
      .upload(caminhoArquivo, buffer, {
        contentType: arquivo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("ERRO NO UPLOAD:", uploadError);

      return NextResponse.json(
        { error: "Não foi possível enviar o documento." },
        { status: 500 }
      );
    }

    const { error: documentoError } = await supabaseAdmin
      .from("documentos_oficina")
      .insert({
        loja_id: lojaId,
        nome_arquivo: arquivo.name.slice(0, 255),
        caminho_arquivo: caminhoArquivo,
        status: "pendente",
      });

    if (documentoError) {
      console.error(
        "ERRO AO REGISTRAR DOCUMENTO:",
        documentoError
      );

      // Remove o arquivo caso o registro no banco falhe.
      await supabaseAdmin.storage
        .from("documentos-oficinas")
        .remove([caminhoArquivo]);

      return NextResponse.json(
        { error: "Não foi possível registrar o documento." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL("/loja/documento-enviado", request.url)
    );
  } catch (error) {
    console.error("ERRO NO ENVIO DO DOCUMENTO:", error);

    return NextResponse.json(
      { error: "Erro inesperado ao enviar o documento." },
      { status: 500 }
    );
  }
}