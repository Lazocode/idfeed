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
    <form onSubmit={handleSubmit}>
      <label className="label" htmlFor="documento">
        Documento com foto
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
        style={{
          width: "100%",
          marginTop: "0.5rem",
        }}
      />

      <button
        id="btn-enviar-documento-submit"
        type="submit"
        className="btn-primary"
        disabled={loading}
        style={{
          width: "100%",
          justifyContent: "center",
          marginTop: "1.25rem",
          padding: "0.75rem",
        }}
      >
        {loading ? "Enviando..." : "Enviar documento"}
      </button>

      {erro && (
        <div
          className="alert-error"
          style={{
            marginTop: "0.75rem",
          }}
        >
          {erro}
        </div>
      )}
    </form>
  );
}
