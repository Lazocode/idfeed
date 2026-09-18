/**
 * @file enviar-documento-form.tsx
 * @description Formulário interativo para envio de documento oficial com foto da oficina mecânica.
 * Transmite o arquivo binário para a API interna `/api/documentos-oficina` e trata feedbacks visuais.
 * @module components/enviar-documento-form
 * @recommendedPath src/components/enviar-documento-form.tsx
 */

"use client";

// 1. Dependências e bibliotecas externas
import React, { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Componente cliente com o formulário de seleção e upload de documento comprobatório da oficina.
 *
 * @returns Formulário com controle de arquivo, estados de loading, mensagens de erro e redirecionamento.
 */
export default function EnviarDocumentoForm() {
  const router = useRouter();

  // Estados locais de controle do formulário
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Processa a submissão do formulário realizando envio via `fetch` HTTP POST.
   *
   * @param e - Evento de formulário React.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      if (!arquivo) {
        setErro("Selecione um documento.");
        setLoading(false);
        return;
      }

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
      setErro("Não foi possível enviar o documento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="documento">
          Documento com foto (RG, CNH ou Contrato Social) *
        </label>

        <input
          id="documento"
          name="documento"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          disabled={loading}
          onChange={(e) => {
            setArquivo(e.target.files?.[0] ?? null);
          }}
          className="w-full text-xs text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-60 cursor-pointer border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Formatos aceitos: JPG, PNG, WEBP ou PDF (máximo 10 MB)
        </p>
      </div>

      {erro && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 animate-in fade-in">
          {erro}
        </div>
      )}

      <button
        id="btn-enviar-documento-submit"
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-60 transition-all shadow-xs cursor-pointer"
      >
        {loading ? "Enviando documento..." : "Enviar documento para análise"}
      </button>
    </form>
  );
}
