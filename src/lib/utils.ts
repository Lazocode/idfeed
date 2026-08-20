export function normPlaca(s: string): string {
  return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Placas são salvas sem pontuação (ex: "ABC1D23"); isso só formata pra exibição. */
export function formatPlaca(p: string): string {
  if (!p || p.length < 4) return p;
  return `${p.slice(0, 3)}-${p.slice(3)}`;
}

export const TIPO_SERVICO_LABEL: Record<string, string> = {
  oleo: "Troca de óleo",
  freios: "Freios",
  revisao: "Revisão",
  eletrica: "Elétrica",
  outros: "Outros",
};

export const TIPO_MOVIMENTACAO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  transferencia: "Transferência",
  inventario: "Contagem",
};

export function formatKm(km: number): string {
  return km.toLocaleString("pt-BR") + " km";
}

export function formatMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  const n = typeof valor === "string" ? parseFloat(valor) : valor;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatData(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
