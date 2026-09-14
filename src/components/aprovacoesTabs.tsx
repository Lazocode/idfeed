"use client";

import Link from "next/link";
import { useState } from "react";

type Oficina = {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  status: string;
  criado_em: string;
};

type Props = {
  pendentes: Oficina[];
  aprovadas: Oficina[];
  rejeitadas: Oficina[];
};

export default function AprovacoesTabs({
  pendentes,
  aprovadas,
  rejeitadas,
}: Props) {
  const [aba, setAba] = useState<
    "pendentes" | "aprovadas" | "rejeitadas"
  >("pendentes");

  const oficinas =
    aba === "pendentes"
      ? pendentes
      : aba === "aprovadas"
        ? aprovadas
        : rejeitadas;

  return (
    <>
      {/* RESUMO */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <Resumo
          titulo="Pendentes"
          quantidade={pendentes.length}
          ativo={aba === "pendentes"}
          onClick={() => setAba("pendentes")}
        />

        <Resumo
          titulo="Aprovadas"
          quantidade={aprovadas.length}
          ativo={aba === "aprovadas"}
          onClick={() => setAba("aprovadas")}
        />

        <Resumo
          titulo="Rejeitadas"
          quantidade={rejeitadas.length}
          ativo={aba === "rejeitadas"}
          onClick={() => setAba("rejeitadas")}
        />
      </div>

      {/* ABAS */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Aba
          titulo="Pendentes"
          ativo={aba === "pendentes"}
          onClick={() => setAba("pendentes")}
        />

        <Aba
          titulo="Aprovadas"
          ativo={aba === "aprovadas"}
          onClick={() => setAba("aprovadas")}
        />

        <Aba
          titulo="Rejeitadas"
          ativo={aba === "rejeitadas"}
          onClick={() => setAba("rejeitadas")}
        />
      </div>

      {/* CABEÇALHO DA LISTA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <div
          style={{
            fontSize: "0.9rem",
            fontWeight: 700,
          }}
        >
          {aba === "pendentes" && "Oficinas pendentes"}
          {aba === "aprovadas" && "Oficinas aprovadas"}
          {aba === "rejeitadas" && "Oficinas rejeitadas"}
        </div>

        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-soft)",
          }}
        >
          {oficinas.length} registro
          {oficinas.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* LISTA */}
      <div
        className="card"
        style={{
          overflow: "hidden",
          padding: 0,
        }}
      >
        {oficinas.length === 0 ? (
          <div
            style={{
              padding: "3rem 1.5rem",
              textAlign: "center",
              color: "var(--text-soft)",
              fontSize: "0.85rem",
            }}
          >
            Nenhuma oficina nesta categoria.
          </div>
        ) : (
          oficinas.map((oficina) => (
            <div
              key={oficina.id}
              className="tbl-row"
              style={{
                padding: "1rem 1.25rem",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background:
                    oficina.status === "pendente"
                      ? "#d97706"
                      : oficina.status === "aprovada"
                        ? "#16a34a"
                        : "#dc2626",
                }}
              />

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: 650,
                    fontSize: "0.9rem",
                  }}
                >
                  {oficina.nome}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginTop: "0.3rem",
                    fontSize: "0.75rem",
                    color: "var(--text-soft)",
                  }}
                >
                  <span>
                    CNPJ: {oficina.cnpj || "Não informado"}
                  </span>

                  <span>
                    {oficina.telefone || "Telefone não informado"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-soft)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {aba === "pendentes" && "Pendente"}
                  {aba === "aprovadas" && "Aprovada"}
                  {aba === "rejeitadas" && "Rejeitada"}
                </span>

                <Link
                  href={`/admin/aprovacoes/${oficina.id}`}
                  className="btn-ghost"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.4rem 0.7rem",
                  }}
                >
                  {aba === "pendentes"
                    ? "Analisar"
                    : "Ver detalhes"}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function Resumo({
  titulo,
  quantidade,
  ativo,
  onClick,
}: {
  titulo: string;
  quantidade: number;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        borderBottom: ativo
          ? "2px solid var(--primary)"
          : "2px solid transparent",
        background: "transparent",
        padding: "0 0 0.35rem",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: "var(--text-soft)",
          marginBottom: "0.2rem",
        }}
      >
        {titulo}
      </div>

      <div
        style={{
          fontSize: "1.35rem",
          fontWeight: 750,
          color: "var(--text)",
        }}
      >
        {quantidade}
      </div>
    </button>
  );
}

function Aba({
  titulo,
  ativo,
  onClick,
}: {
  titulo: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        borderBottom: ativo
          ? "2px solid var(--primary)"
          : "2px solid transparent",
        background: "transparent",
        padding: "0.75rem 0.9rem",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: ativo ? 700 : 500,
        color: ativo ? "var(--text)" : "var(--text-soft)",
      }}
    >
      {titulo}
    </button>
  );
}