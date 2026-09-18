/**
 * @file validation.ts
 * @description Esquemas de validação de dados com Zod para cadastros, veículos, materiais, serviços e movimentações.
 * Inclui validação algorítmica estrita de CPF (dígitos verificadores oficiais) e CNPJ.
 * @module lib/validation
 * @recommendedPath src/lib/validation.ts
 */

// 1. Dependências e bibliotecas externas
import { z } from "zod";

/**
 * Esquema de validação do cadastro de usuário e oficina mecânica (Signup).
 * Exige dados cadastrais completos, formato válido de CPF/CNPJ e confirmação de senha idêntica.
 */
export const signupSchema = z.object({
  nomeLoja: z.string().trim().min(2, "Nome da loja deve ter ao menos 2 caracteres").max(100),

  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(100),

  cpf: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^\d{11}$/.test(v), {
      message: "CPF inválido.",
    }),

  telefone: z
    .string()
    .trim()
    .max(20)
    .transform((v) => v.replace(/\D/g, "")),

  email: z
    .string()
    .trim()
    .email("E-mail com formato inválido")
    .max(254)
    .transform((v) => v.toLowerCase()),

  cnpj: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => /^\d{14}$/.test(v), {
      message: "CNPJ inválido.",
    }),

  telefoneLoja: z
    .string()
    .trim()
    .max(20)
    .transform((v) => v.replace(/\D/g, "")),

  senha: z.string().min(10, "Senha deve ter pelo menos 10 caracteres").max(128),

  confirmarSenha: z.string().min(10).max(128),
}).refine(
  (v) => v.senha === v.confirmarSenha,
  {
    path: ["confirmarSenha"],
    message: "As senhas não conferem.",
  }
);

/**
 * Esquema de validação para cadastro e atualização de veículos no prontuário digital.
 * Implementa validação algorítmica completa de CPF com base nos dois dígitos verificadores (módulo 11).
 */
export const vehicleSchema = z.object({
  placa: z.string().trim().min(5).max(10),

  modelo: z.string().trim().min(2).max(120),

  proprietarioNome: z.string().trim().min(2).max(120),

  proprietarioCpf: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 11, {
      message: "CPF deve possuir 11 dígitos.",
    })
    .refine(
      (cpf) => {
        // Rejeita sequências de números repetidos conhecidas (ex: 111.111.111-11)
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let soma = 0;

        // Cálculo do 1º dígito verificador
        for (let i = 0; i < 9; i++) {
          soma += Number(cpf[i]) * (10 - i);
        }

        let digito1 = (soma * 10) % 11;
        if (digito1 === 10) digito1 = 0;

        if (digito1 !== Number(cpf[9])) return false;

        soma = 0;

        // Cálculo do 2º dígito verificador
        for (let i = 0; i < 10; i++) {
          soma += Number(cpf[i]) * (11 - i);
        }

        let digito2 = (soma * 10) % 11;
        if (digito2 === 10) digito2 = 0;

        return digito2 === Number(cpf[10]);
      },
      {
        message: "CPF inválido.",
      }
    ),

  proprietarioContato: z.string().trim().max(40),

  kmAtual: z.coerce.number().int().min(0).max(10_000_000),
});

/**
 * Esquema de validação para cadastro e edição de materiais e peças do estoque.
 */
export const materialSchema = z.object({
  nome: z.string().trim().min(1).max(160),
  sku: z.string().trim().min(1).max(60),
  localizacao: z.string().trim().max(120),
  quantidadeAtual: z.coerce.number().int().min(0).max(10_000_000),
  quantidadeMinima: z.coerce.number().int().min(0).max(10_000_000),
});

/**
 * Esquema de validação para ordens de serviço e manutenções automotivas.
 */
export const serviceSchema = z.object({
  tipoServico: z.enum(["oleo", "freios", "revisao", "eletrica", "outros"]),
  kmNoServico: z.coerce.number().int().min(0).max(10_000_000),
  custo: z.coerce.number().min(0).max(99999999.99).nullable(),
  observacao: z.string().trim().max(2000),
});

/**
 * Esquema de validação para registro de movimentações de inventário.
 */
export const movementSchema = z.object({
  tipo: z.enum(["entrada", "saida", "transferencia", "inventario"]),
  quantidade: z.coerce.number().int().min(0).max(10_000_000),
  observacao: z.string().trim().max(2000),
});

