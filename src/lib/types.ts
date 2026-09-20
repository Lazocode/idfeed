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

/**
 * Categorias permitidas de feedback de clientes e testadores.
 */
export type FeedbackCategoria = "sugestao" | "elogio" | "problema" | "opiniao";

/**
 * Tipos de perfil de usuário que submeteram o feedback.
 */
export type FeedbackTipoUsuario = "cliente" | "oficina" | "testador";

/**
 * Estrutura de entrada para cadastro de um novo feedback.
 */
export interface FeedbackInput {
  /** Nome ou identificação voluntária do usuário. */
  nome?: string;
  /** Contato (e-mail ou WhatsApp) voluntário para retorno. */
  contato?: string;
  /** Tipo de usuário que está enviando (cliente, oficina ou testador). */
  tipo_usuario: FeedbackTipoUsuario;
  /** Categoria da manifestação. */
  categoria: FeedbackCategoria;
  /** Avaliação em escala de 1 a 5 estrelas (opcional). */
  avaliacao?: number;
  /** Texto da opinião, sugestão ou relato do problema. */
  mensagem: string;
  /** Rota ou contexto da tela de onde o feedback foi enviado. */
  pagina_origem?: string;
}

/**
 * Registro completo de feedback persistido no banco de dados.
 */
export interface FeedbackItem {
  /** Identificador único do registro (UUID). */
  id: string;
  /** Nome ou identificação voluntária do usuário. */
  nome?: string | null;
  /** Contato (e-mail ou WhatsApp) voluntário para retorno. */
  contato?: string | null;
  /** Tipo de usuário que está enviando (cliente, oficina ou testador). */
  tipo_usuario: FeedbackTipoUsuario;
  /** Categoria da manifestação. */
  categoria: FeedbackCategoria;
  /** Avaliação em escala de 1 a 5 estrelas (opcional). */
  avaliacao?: number | null;
  /** Texto da opinião, sugestão ou relato do problema. */
  mensagem: string;
  /** Rota ou contexto da tela de onde o feedback foi enviado. */
  pagina_origem?: string | null;
  /** Timestamp ISO de criação do feedback. */
  criado_em: string;
}

