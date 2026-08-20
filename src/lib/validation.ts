import { z } from "zod";

export const signupSchema = z.object({
  nomeLoja: z.string().trim().min(2).max(100),
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((v) => v.toLowerCase()),
  senha: z.string().min(10).max(128),
  confirmarSenha: z.string().min(10).max(128),
}).refine((v) => v.senha === v.confirmarSenha, { path: ["confirmarSenha"], message: "As senhas não conferem." });

export const vehicleSchema = z.object({
  placa: z.string().trim().min(5).max(10),
  modelo: z.string().trim().min(2).max(120),
  proprietarioNome: z.string().trim().min(2).max(120),
  proprietarioContato: z.string().trim().max(40),
  kmAtual: z.coerce.number().int().min(0).max(10_000_000),
});

export const materialSchema = z.object({
  nome: z.string().trim().min(1).max(160),
  sku: z.string().trim().min(1).max(60),
  localizacao: z.string().trim().max(120),
  quantidadeAtual: z.coerce.number().int().min(0).max(10_000_000),
  quantidadeMinima: z.coerce.number().int().min(0).max(10_000_000),
});

export const serviceSchema = z.object({
  tipoServico: z.enum(["oleo", "freios", "revisao", "eletrica", "outros"]),
  kmNoServico: z.coerce.number().int().min(0).max(10_000_000),
  custo: z.coerce.number().min(0).max(99999999.99).nullable(),
  observacao: z.string().trim().max(2000),
});

export const movementSchema = z.object({
  tipo: z.enum(["entrada", "saida", "transferencia", "inventario"]),
  quantidade: z.coerce.number().int().min(0).max(10_000_000),
  observacao: z.string().trim().max(2000),
});
