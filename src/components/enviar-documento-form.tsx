/**
 * @file enviar-documento-form.tsx
 * @description Formulário interativo para envio de documento comprobatório da oficina mecânica.
 * Transmite o arquivo binário para a API interna `/api/documentos-oficina` com suporte a drag-and-drop,
 * pré-visualização de metadados e tratativa de feedbacks visuais.
 * @module components/enviar-documento-form
 * @recommendedPath src/components/enviar-documento-form.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";

/**
 * Formata tamanho em bytes para formato legível (KB ou MB).
 *
 * @param bytes - Quantidade de bytes.
 * @returns String formatada com unidade.
 */
function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Componente cliente com o formulário de seleção e upload de documento comprobatório da oficina.
 *
 * @returns Formulário com suporte a clique e arrasto, estados de carregamento e feedback visual.
 */
export default function EnviarDocumentoForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados locais de controle do formulário
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Processa a seleção ou soltura de um arquivo.
   *
   * @param file - Arquivo selecionado pelo usuário.
   */
  function handleFileSelected(file: File | undefined) {
    if (!file) return;

    // Limite de 10 MB
    if (file.size > 10 * 1024 * 1024) {
      setErro("O documento deve ter no máximo 10 MB.");
      return;
    }

    const tiposValidos = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!tiposValidos.includes(file.type)) {
      setErro("Formato não suportado. Envie um arquivo JPG, PNG, WEBP ou PDF.");
      return;
    }

    setErro("");
    setArquivo(file);
  }

  /**
   * Trata o evento de soltar arquivo na área de drag-and-drop.
   */
  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    if (loading) return;

    const file = e.dataTransfer.files?.[0];
    handleFileSelected(file);
  }

  /**
   * Processa a submissão do formulário realizando envio via `fetch` HTTP POST.
   *
   * @param e - Evento de formulário React.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!arquivo) {
      setErro("Selecione ou arraste um documento antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      // Envia o arquivo como payload binário com cabeçalho de nome codificado
      const response = await fetch("/api/documentos-oficina", {
        method: "POST",
        headers: {
          "Content-Type": arquivo.type,
          "X-File-Name": encodeURIComponent(arquivo.name),
        },
        body: arquivo,
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.error ?? "Não foi possível enviar o documento.");
        return;
      }

      // Redireciona para a página de confirmação de envio
      router.push("/loja/documento-enviado");
    } catch (error) {
      console.error("ERRO AO ENVIAR DOCUMENTO:", error);
      setErro("Não foi possível enviar o documento. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label
          htmlFor="documento"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
        >
          Documento Oficial (Contrato Social, Cartão CNPJ ou RG/CNH) *
        </label>

        <input
          ref={fileInputRef}
          id="documento"
          name="documento"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          disabled={loading}
          onChange={(e) => {
            handleFileSelected(e.target.files?.[0]);
          }}
          className="sr-only"
        />

        {/* Área Interativa Drag-and-Drop + Seleção por Clique */}
        {!arquivo ? (
          <div
            id="dropzone-documento"
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer select-none ${
              isDragging
                ? "border-blue-500 bg-blue-50/60 scale-[0.99]"
                : "border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20"
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-slate-800">
              Clique para selecionar ou arraste o arquivo aqui
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, JPG, PNG ou WEBP (até 10 MB)
            </p>
          </div>
        ) : (
          /* Pré-visualização do Arquivo Selecionado */
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {arquivo.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span>{formatarTamanho(arquivo.size)}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Pronto para envio
                  </span>
                </div>
              </div>
            </div>

            <button
              id="btn-remover-arquivo"
              type="button"
              disabled={loading}
              onClick={() => {
                setArquivo(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Remover documento"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {erro && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{erro}</span>
        </div>
      )}

      <button
        id="btn-enviar-documento-submit"
        type="submit"
        disabled={loading || !arquivo}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enviando documento...</span>
          </>
        ) : (
          <span>Enviar documento para homologação</span>
        )}
      </button>
    </form>
  );
}

