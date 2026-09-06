"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EnviarDocumentoForm() {
  const router = useRouter();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

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