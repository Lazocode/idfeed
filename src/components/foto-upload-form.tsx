/**
 * @file foto-upload-form.tsx
 * @description Formulário de upload de fotografias para veículos e peças/materiais de estoque.
 * Valida o tamanho máximo permitido (10 MB) e despacha a imagem para a Server Action `enviarFoto`.
 * @module components/foto-upload-form
 * @recommendedPath src/components/foto-upload-form.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

// 2. Ações de servidor (Server Actions)
import { enviarFoto } from "@/actions/fotos";

/**
 * Propriedades do formulário de upload de fotos.
 */
interface FotoUploadFormProps {
  /** Tipo da entidade que receberá a foto anexada ("veiculo" ou "material"). */
  entidadeTipo: "veiculo" | "material";
  /** Identificador único da entidade no banco de dados (UUID). */
  entidadeId: string;
}

/**
 * Componente cliente para captura/seleção e envio de fotos.
 *
 * @param props - Propriedades contendo o tipo e o ID da entidade destino.
 * @returns Formulário estilizado com input de arquivo, botões de ação e mensagens de feedback.
 */
export default function FotoUploadForm({
  entidadeTipo,
  entidadeId,
}: FotoUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  /**
   * Trata o envio do arquivo selecionado após validação de tamanho.
   *
   * @param e - Evento de submissão do formulário.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    const input = fileInputRef.current;
    if (!input || !input.files || input.files.length === 0) {
      setErro("Selecione uma imagem antes de enviar.");
      return;
    }

    const file = input.files[0];
    // Validação de limite de 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setErro("A foto deve ter no máximo 10 MB.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("foto", file);

    try {
      await enviarFoto(entidadeTipo, entidadeId, formData);
      setSucesso(true);
      if (input) input.value = "";
      router.refresh();
      setTimeout(() => setSucesso(false), 4000);
    } catch (err: unknown) {
      console.error("Erro no upload da foto:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Não foi possível enviar a foto. Verifique a conexão e o formato do arquivo.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {erro && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Erro no envio da foto:</p>
            <p className="mt-0.5">{erro}</p>
          </div>
        </div>
      )}

      {sucesso && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Foto adicionada com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <input
          id={`input-foto-${entidadeId}`}
          ref={fileInputRef}
          type="file"
          name="foto"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={loading}
          className="w-full sm:w-auto flex-1 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-60 cursor-pointer"
        />
        <button
          id={`btn-enviar-foto-${entidadeId}`}
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-60 transition-colors shadow-2xs cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Enviando foto...</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              <span>Adicionar Foto</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

