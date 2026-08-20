export type OrdemServicoComRelacoes = {
  id: string;
  tipo_servico: string;
  km_no_servico: number;
  custo: number | string | null;
  observacao: string | null;
  criado_em: string;
  mecanico: { nome: string } | null;
  pecas: { quantidade: number; material: { nome: string } | null }[];
};

export type MovimentacaoComRelacoes = {
  id: string;
  tipo: string;
  quantidade: number;
  observacao: string | null;
  criado_em: string;
  responsavel: { nome: string } | null;
};
