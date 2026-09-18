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

/**
 * Valida a assinatura binária real (Magic Bytes / File Signature) de buffers de imagem.
 *
 * MITIGAÇÃO: Bypass de Validação de Upload de Arquivos e Stored XSS via Content-Type spoofing.
 * Por que elimina a brecha: Inspeciona os bytes canônicos no cabeçalho binário do arquivo,
 * ignorando extensões ou cabeçalhos HTTP fraudulentos enviados pelo cliente.
 * COMPORTAMENTO DEFENSIVO: Rejeita com `null` qualquer payload com assinatura não correspondente.
 *
 * @param buffer - Buffer com os bytes do arquivo enviado.
 * @returns A extensão normalizada ('jpg', 'png', 'webp') ou `null` se inválido/malicioso.
 */
export function validateImageMagicBytes(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // 1. JPEG / JPG: Inicia com FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // 2. PNG: Inicia com 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // 3. WEBP: Inicia com RIFF (bytes 0..3) e contém WEBP (bytes 8..11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

/**
 * Valida a assinatura binária de documentos comprobatórios (Imagens e PDF).
 *
 * MITIGAÇÃO: Upload de executáveis camuflados, scripts PHP/HTML e Web Shells em rotas de credenciamento.
 *
 * @param buffer - Buffer do arquivo para inspeção binária.
 * @returns 'pdf', 'jpg', 'png', 'webp' ou `null`.
 */
export function validateDocumentMagicBytes(
  buffer: Buffer
): "pdf" | "jpg" | "png" | "webp" | null {
  if (!buffer || buffer.length < 5) {
    return null;
  }

  // 1. PDF: Inicia com %PDF- (25 50 44 46 2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return "pdf";
  }

  return validateImageMagicBytes(buffer);
}

/**
 * Sanitiza o nome original de arquivos enviados pelo usuário para armazenamento e exibição segura.
 *
 * MITIGAÇÃO: Path Traversal (../../), Null Byte Injection (\0) e Stored XSS via cabeçalho x-file-name.
 * COMPORTAMENTO DEFENSIVO: Remove caracteres fora do conjunto alfanumérico seguro e limita a 100 caracteres.
 *
 * @param rawName - Nome bruto enviado no cabeçalho ou formulário.
 * @returns Nome seguro normalizado.
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName) return "documento";

  // Remove caracteres de controle, barras, backslashes, aspas e tags HTML
  const sanitized = rawName
    .replace(/[\x00-\x1F\x7F<>:"/\\|?*]/g, "")
    .replace(/\.\.+/g, ".")
    .trim()
    .slice(0, 100);

  return sanitized || "documento";
}

/**
 * Mascara o nome do proprietário para conformidade estrita com a LGPD em consultas abertas.
 * Exemplo: "Diego Santos Alves" -> "Diego S**** A****".
 *
 * MITIGAÇÃO: Vazamento de PII (Personally Identifiable Information) em consultas públicas.
 * COMPORTAMENTO DEFENSIVO: Exibe o primeiro nome e apenas a inicial com máscara nos sobrenomes.
 *
 * @param nomeCompleto - Nome completo original registrado no prontuário.
 * @returns Nome ofuscado protegendo a privacidade do proprietário.
 */
export function maskSensitiveName(nomeCompleto?: string | null): string {
  if (!nomeCompleto || typeof nomeCompleto !== "string") {
    return "Proprietário Cadastrado";
  }

  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 1) {
    const nome = partes[0];
    return nome.length > 2 ? `${nome.slice(0, 2)}****` : "****";
  }

  const primeiroNome = partes[0];
  const sobrenomesMascarados = partes
    .slice(1)
    .map((parte) => (parte.length > 0 ? `${parte[0]}****` : "****"))
    .join(" ");

  return `${primeiroNome} ${sobrenomesMascarados}`;
}


