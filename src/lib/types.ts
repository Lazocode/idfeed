/**
 * @file types.ts
 * @description Definições de tipos e interfaces TypeScript para entidades com relacionamentos agregados
 * (como Ordens de Serviço com mecânicos/peças e Movimentações de Estoque com responsáveis).
 * @module lib/types
 * @recommendedPath src/lib/types.ts
 */

/**
 * Representa uma Ordem de Serviço veicular enriquecida com seus relacionamentos de mecânico e peças vinculadas.
 */
export type OrdemServicoComRelacoes = {
  /** Identificador único da Ordem de Serviço (UUID). */
  id: string;
  /** Categoria técnica do serviço realizado (ex: "oleo", "freios", "revisao", etc.). */
  tipo_servico: string;
  /** Quilometragem registrada do odômetro no momento da execução. */
  km_no_servico: number;
  /** Custo total cobrado pela manutenção (valor monetário). */
  custo: number | string | null;
  /** Observações ou diagnóstico técnico descritivo. */
  observacao: string | null;
  /** Timestamp ISO de criação do registro. */
  criado_em: string;
  /** Dados do mecânico ou operador responsável pela execução. */
  mecanico: {
    nome: string;
  } | null;
  /** Lista de itens de peças/materiais de estoque baixados nesta ordem. */
  pecas: {
    quantidade: number;
    material: {
      nome: string;
    } | null;
  }[];
};

/**
 * Representa uma movimentação física de estoque com relacionamento do usuário operador.
 */
export type MovimentacaoComRelacoes = {
  /** Identificador único da movimentação (UUID). */
  id: string;
  /** Tipo da movimentação de inventário ("entrada", "saida", "transferencia", "inventario"). */
  tipo: string;
  /** Quantidade movimentada (positiva para acréscimo ou dedução conforme o tipo). */
  quantidade: number;
  /** Motivo ou observação da movimentação. */
  observacao: string | null;
  /** Timestamp ISO de efetivação do registro. */
  criado_em: string;
  /** Usuário que registrou a movimentação no estoque. */
  responsavel: {
    nome: string;
  } | null;
};

