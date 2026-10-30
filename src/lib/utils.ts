/**
 * @file utils.ts
 * @description Conjunto de funções utilitárias para normalização e formatação de dados
 * (placas no padrão Mercosul e antigo, quilometragem, valores monetários em BRL, datas e dicionários de labels).
 * @module lib/utils
 * @recommendedPath src/lib/utils.ts
 */

/**
 * Normaliza strings de placa veicular, removendo pontuações, traços, espaços e convertendo para caixa alta.
 *
 * @param s - Placa em formato bruto (ex: "abc-1d23" ou "abc 1234").
 * @returns Placa higienizada sem caracteres especiais (ex: "ABC1D23").
 */
export function normPlaca(s: string): string {
  return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Formata placas veiculares (Mercosul ou padrão cinza anterior) adicionando hífen após os 3 primeiros caracteres.
 * Placas são gravadas no banco de dados sem pontuação (ex: "ABC1D23") e formatadas apenas para apresentação visual.
 *
 * @param p - Placa normalizada ou em formato bruto.
 * @returns Placa formatada para exibição legível (ex: "ABC-1D23" ou "ABC-1234").
 */
export function formatPlaca(p: string): string {
  if (!p || p.length < 4) return p;
  return `${p.slice(0, 3)}-${p.slice(3)}`;
}

/**
 * Mapeamento descritivo amigável para categorias técnicas de Ordens de Serviço.
 */
export const TIPO_SERVICO_LABEL: Record<string, string> = {
  oleo: "Troca de óleo",
  freios: "Freios",
  revisao: "Revisão",
  eletrica: "Elétrica",
  outros: "Outros",
};

/**
 * Mapeamento descritivo legível para tipos de movimentação no controle de estoque.
 */
export const TIPO_MOVIMENTACAO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  transferencia: "Transferência",
  inventario: "Contagem",
};

/**
 * Formata um valor numérico de quilometragem no padrão brasileiro com sufixo "km".
 *
 * @param km - Valor do odômetro em quilômetros.
 * @returns String formatada (ex: "125.400 km").
 */
export function formatKm(km: number): string {
  return km.toLocaleString("pt-BR") + " km";
}

/**
 * Converte um valor numérico ou representação em string para formato de moeda Real Brasileiro (BRL).
 *
 * @param valor - Valor monetário (ex: 150.5, "150.50", null).
 * @returns Valor monetário formatado (ex: "R$ 150,50") ou travessão caso indefinido.
 */
export function formatMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  const n = typeof valor === "string" ? parseFloat(valor) : valor;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Formata uma data para exibição concisa no padrão "dd mmm" (ex: "14 de out.").
 *
 * @param d - Objeto Date ou string ISO representando a data.
 * @returns String formatada segundo o locale pt-BR.
 */
export function formatData(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

