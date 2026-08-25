"use client";

import { useState } from "react";
import { ConsultarVeiculo } from "@/actions/consultaVeiculo";
import {
  formatPlaca,
  formatKm,
  formatData,
  TIPO_SERVICO_LABEL,
} from "@/lib/utils";

export default function ConsultaVeiculo() {
  const [placa, setPlaca] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [veiculo, setVeiculo] = useState<any>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setVeiculo(null);
    setLoading(true);

    try {
      const resultado = await ConsultarVeiculo(placa, cpf);

      if (resultado.erro) {
        setErro(resultado.erro);
      } else {
        setVeiculo(resultado.veiculo);
      }
    } catch (error) {
      console.error(error);
      setErro("Não foi possível realizar a consulta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.9rem",
          textAlign: "left",
        }}
      >
        <div>
          <label htmlFor="placa" className="label">
            Placa do veículo
          </label>

          <input
            id="placa"
            className="input"
            placeholder="ABC1D23"
            value={placa}
            onChange={(e) => setPlaca(e.target.value.toUpperCase())}
            maxLength={7}
            autoComplete="off"
            required
          />
        </div>

        <div>
          <label htmlFor="cpf" className="label">
            CPF do proprietário
          </label>

          <input
            id="cpf"
            className="input"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            maxLength={14}
            inputMode="numeric"
            autoComplete="off"
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{
            justifyContent: "center",
            padding: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          {loading ? "Consultando..." : "Consultar veículo"}
        </button>
      </form>

      {erro && (
        <div
          className="alert-error"
          style={{
            marginTop: "1rem",
            textAlign: "left",
          }}
        >
          {erro}
        </div>
      )}

      {veiculo && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "2rem",
            textAlign: "left",
          }}
        >
          <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-soft)",
                textTransform: "uppercase",
              }}
            >
              Veículo
            </div>

            <div style={{ fontSize: "2rem", fontWeight: 800 }}>
              {formatPlaca(veiculo.placa)}
            </div>

            <div style={{ color: "var(--text-soft)" }}>
              {veiculo.modelo}
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                marginTop: "0.75rem",
                fontSize: "0.82rem",
                color: "var(--text-soft)",
              }}
            >
              <span>
                Quilometragem: {formatKm(veiculo.km_atual)}
              </span>

              <span>
                Oficina: {veiculo.loja?.nome}
              </span>
            </div>

            {veiculo.km_proxima_revisao && (
              <div
                style={{
                  marginTop: "0.9rem",
                  background: "var(--amber-dim)",
                  border: "1px solid var(--amber)",
                  borderRadius: 6,
                  padding: "0.6rem 0.9rem",
                  fontSize: "0.82rem",
                  color: "var(--amber)",
                }}
              >
                {veiculo.nota_proxima_revisao ?? "Próxima revisão"}:{" "}
                {formatKm(veiculo.km_proxima_revisao)}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: "1rem 1.25rem" }}>
            <div
              className="section-heading"
              style={{ marginBottom: "1rem" }}
            >
              Histórico autorizado
            </div>

            {veiculo.ordens_servico.length === 0 && (
              <p
                style={{
                  color: "var(--text-soft)",
                  fontSize: "0.875rem",
                }}
              >
                Nenhuma manutenção registrada.
              </p>
            )}

            {veiculo.ordens_servico.map(
              (
                os: {
                  criado_em: string;
                  tipo_servico: keyof typeof TIPO_SERVICO_LABEL;
                  km_no_servico: number;
                },
                i: number
              ) => (
                <div
                  key={`${os.criado_em}-${i}`}
                  style={{
                    padding: "0.75rem 0",
                    borderBottom:
                      i < veiculo.ordens_servico.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <strong>
                    {TIPO_SERVICO_LABEL[os.tipo_servico]}
                  </strong>

                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginTop: 4,
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>{formatData(os.criado_em)}</span>
                    <span>{formatKm(os.km_no_servico)}</span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}