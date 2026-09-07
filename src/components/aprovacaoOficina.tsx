"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  aprovarOficina,
  rejeitarOficina,
} from "@/actions/aprovacao";

export default function AprovacaoOficina({
  lojaId,
}: {
  lojaId: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [modoRejeicao, setModoRejeicao] = useState(false);
  const [observacao, setObservacao] = useState("");

  async function handleAprovar() {
    setErro("");
    setLoading(true);

    try {
      await aprovarOficina(lojaId);

      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível aprovar a oficina."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRejeitar() {
    setErro("");

    if (!observacao.trim()) {
      setErro("Informe o motivo da rejeição.");
      return;
    }

    setLoading(true);

    try {
      await rejeitarOficina(lojaId, observacao);

      router.refresh();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível rejeitar a oficina."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {!modoRejeicao ? (
        <>
          <button
            type="button"
            onClick={handleAprovar}
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "0.75rem",
            }}
          >
            {loading ? "Aprovando..." : "Aprovar oficina"}
          </button>

          <button
            type="button"
            onClick={() => {
              setErro("");
              setModoRejeicao(true);
            }}
            disabled={loading}
            className="btn-ghost"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "0.75rem",
              marginTop: "0.75rem",
            }}
          >
            Rejeitar oficina
          </button>
        </>
      ) : (
        <div>
          <label
            htmlFor="observacao"
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            Motivo da rejeição
          </label>

          <textarea
            id="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Informe por que o cadastro está sendo rejeitado..."
            maxLength={500}
            rows={4}
            disabled={loading}
            style={{
              width: "100%",
              resize: "vertical",
              padding: "0.75rem",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              marginTop: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={handleRejeitar}
              disabled={loading}
              className="btn-primary"
              style={{
                flex: 1,
                justifyContent: "center",
                padding: "0.75rem",
              }}
            >
              {loading ? "Rejeitando..." : "Confirmar rejeição"}
            </button>

            <button
              type="button"
              onClick={() => {
                setErro("");
                setObservacao("");
                setModoRejeicao(false);
              }}
              disabled={loading}
              className="btn-ghost"
              style={{
                flex: 1,
                justifyContent: "center",
                padding: "0.75rem",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro && (
        <div
          className="alert-error"
          style={{ marginTop: "0.75rem" }}
        >
          {erro}
        </div>
      )}
    </div>
  );
}