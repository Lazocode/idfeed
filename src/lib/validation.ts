/**
 * @file validation.ts
 * @description Esquemas de validação de dados com Zod para cadastros, veículos, materiais, serviços, movimentações e feedbacks.
 * Inclui validação algorítmica estrita de CPF e CNPJ (dígitos verificadores oficiais), sanitização contra PostgREST
 * Filter Injection, validação de UUID e inspeção de assinatura binária (Magic Bytes) para uploads.
 * @module lib/validation
 * @recommendedPath src/lib/validation.ts
 */

// 1. Dependências e bibliotecas externas
import { z } from "zod";

/**
 * Expressão regular estrita para validação de identificadores UUID.
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verifica se uma string corresponde a um identificador UUID válido.
 *
 * @param id - String a ser testada.
 * @returns `true` se for um UUID válido; caso contrário, `false`.
 */
export function isValidUuid(id?: string | null): boolean {
  if (!id || typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Valida algoritmicamente um número de CPF brasileiro (11 dígitos e módulo 11).
 * Rejeita sequências repetidas conhecidas (ex: 000.000.000-00, 111.111.111-11).
 *
 * @param cpfRaw - CPF com ou sem máscara.
 * @returns `true` se os dígitos verificadores forem matematicamente válidos.
 */
export function isValidCpf(cpfRaw: string): boolean {
  const cpf = (cpfRaw || "").replace(/\D/g, "");
  if (cpf.length !== 11) return false;
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
}

/**
 * Valida algoritmicamente um número de CNPJ brasileiro (14 dígitos e módulo 11).
 * Rejeita sequências de dígitos repetidos (ex: 00.000.000/0000-00).
 *
 * @param cnpjRaw - CNPJ com ou sem pontuação.
 * @returns `true` se os dígitos verificadores do CNPJ forem válidos.
 */
export function isValidCnpj(cnpjRaw: string): boolean {
  const cnpj = (cnpjRaw || "").replace(/\D/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += Number(cnpj[i]) * pesos1[i];
  }
  const resto1 = soma % 11;
  const digito1 = resto1 < 2 ? 0 : 11 - resto1;
  if (digito1 !== Number(cnpj[12])) return false;

  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += Number(cnpj[i]) * pesos2[i];
  }
  const resto2 = soma % 11;
  const digito2 = resto2 < 2 ? 0 : 11 - resto2;

  return digito2 === Number(cnpj[13]);
}

/**
 * Sanitiza termos de busca livre antes de interpolá-los em filtros PostgREST (`.or()` / `.ilike()`).
 *
 * MITIGAÇÃO: PostgREST Filter Injection.
 * Por que elimina a brecha: Remove operadores lógicos e delimitadores sintáticos do PostgREST
 * (vírgulas, parênteses, curingas, barras e aspas) que permitiriam injetar condições arbitrárias na query.
 *
 * @param rawQuery - Termo de pesquisa informado na query string.
 * @returns Termo seguro e truncado em até 80 caracteres.
 */
export function sanitizeSearchQuery(rawQuery?: string | null): string {
  if (!rawQuery || typeof rawQuery !== "string") return "";
  return rawQuery
    .replace(/[,()*%_"\\']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Normaliza números de telefone brasileiros, tratando prefixos internacionais como +55 ou 55,
 * espaços, parênteses e hifens.
 *
 * Regra de negócio:
 * - Remove todos os caracteres não-dígitos.
 * - Se contiver 12 ou 13 dígitos iniciando com o DDI '55' do Brasil:
 *   Remove o '55' inicial, extraindo o DDD de 2 dígitos + número local (8 ou 9 dígitos).
 *   Ex: "+55 (21) 98765-4321" -> dígitos "5521987654321" -> normalizado "21987654321" (11 dígitos).
 *   Ex: "+55 (21) 3333-4444" -> dígitos "552133334444" -> normalizado "2133334444" (10 dígitos).
 * - Se o usuário digitou explicitamente "+55" seguido de dígitos, remove o 55 inicial.
 * - Preserva DDDs nacionais (inclusive o DDD 55 do RS quando o número tiver 10 ou 11 dígitos no total).
 *
 * @param valor - String crua informada pelo usuário.
 * @returns Dígitos limpos e normalizados (10 ou 11 dígitos numéricos).
 */
export function normalizarTelefone(valor?: string | null): string {
  if (!valor) return "";
  const limpo = valor.trim();
  let digitos = limpo.replace(/\D/g, "");

  // Se tiver 12 ou 13 dígitos e começar com o DDI 55 do Brasil:
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2);
  } else if (limpo.startsWith("+55") && digitos.startsWith("55") && digitos.length > 2) {
    // Se o usuário digitou explicitamente "+55" seguido de outros números
    digitos = digitos.slice(2);
  }

  return digitos;
}

/**
 * Esquema de validação do cadastro de usuário e oficina mecânica (Signup).
 * Exige dados cadastrais completos, validação algorítmica de CPF/CNPJ e confirmação de senha idêntica.
 */
export const signupSchema = z
  .object({
    nomeLoja: z
      .string()
      .trim()
      .min(2, "Nome da loja deve ter ao menos 2 caracteres")
      .max(100),

    nome: z
      .string()
      .trim()
      .min(2, "Nome deve ter ao menos 2 caracteres")
      .max(100),

    cpf: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length === 11, {
        message: "CPF deve possuir 11 dígitos.",
      })
      .refine((v) => isValidCpf(v), {
        message: "CPF inválido.",
      }),

    telefone: z
      .string()
      .trim()
      .max(35, "Telefone deve conter no máximo 35 caracteres.")
      .transform((v) => normalizarTelefone(v))
      .refine((v) => v.length >= 10 && v.length <= 11, {
        message:
          "Informe um telefone do responsável válido com DDD (10 ou 11 dígitos).",
      }),

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
      .refine((v) => v.length === 14, {
        message: "CNPJ deve possuir 14 dígitos.",
      })
      .refine((v) => isValidCnpj(v), {
        message: "CNPJ inválido.",
      }),

    telefoneLoja: z
      .string()
      .trim()
      .max(35, "Telefone da oficina deve conter no máximo 35 caracteres.")
      .transform((v) => normalizarTelefone(v))
      .refine((v) => v.length >= 10 && v.length <= 11, {
        message:
          "Informe um telefone da oficina válido com DDD (10 ou 11 dígitos).",
      }),

    senha: z
      .string()
      .min(10, "Senha deve ter pelo menos 10 caracteres")
      .max(128),

    confirmarSenha: z.string().min(10).max(128),
  })
  .refine((v) => v.senha === v.confirmarSenha, {
    path: ["confirmarSenha"],
    message: "As senhas não conferem.",
  });

/**
 * Esquema de validação para cadastro e atualização de veículos no prontuário digital.
 * Implementa validação de formato de placa (Mercosul ou padrão cinza) e validação algorítmica completa de CPF.
 */
export const vehicleSchema = z.object({
  placa: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .refine((v) => /^[A-Z0-9]{7}$/.test(v), {
      message: "Placa inválida. Informe os 7 caracteres no padrão Mercosul ou convencional.",
    }),

  modelo: z.string().trim().min(2).max(120),

  proprietarioNome: z.string().trim().min(2).max(120),

  proprietarioCpf: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 11, {
      message: "CPF deve possuir 11 dígitos.",
    })
    .refine((cpf) => isValidCpf(cpf), {
      message: "CPF inválido.",
    }),

  proprietarioContato: z
    .string()
    .trim()
    .max(50, "Contato deve conter no máximo 50 caracteres.")
    .transform((v) => {
      // Se não informado, retorna vazio
      if (!v) return "";
      // Se for telefone (contém números e não é e-mail)
      if (!v.includes("@") && /\d/.test(v)) {
        const norm = normalizarTelefone(v);
        if (norm.length === 11) {
          return `(${norm.slice(0, 2)}) ${norm.slice(2, 7)}-${norm.slice(7)}`;
        }
        if (norm.length === 10) {
          return `(${norm.slice(0, 2)}) ${norm.slice(2, 6)}-${norm.slice(6)}`;
        }
      }
      return v;
    }),

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
 * Esquema de validação para submissão de feedbacks de usuários e testadores.
 */
export const feedbackSchema = z.object({
  nome: z.string().trim().max(100).optional(),
  contato: z.string().trim().max(120).optional(),
  tipo_usuario: z
    .enum(["cliente", "oficina", "testador"])
    .default("cliente"),
  categoria: z
    .enum(["sugestao", "elogio", "problema", "opiniao"])
    .default("sugestao"),
  avaliacao: z.number().int().min(1).max(5).optional(),
  mensagem: z
    .string()
    .trim()
    .min(1, "Por favor, escreva sua mensagem ou opinião antes de enviar.")
    .max(3000),
  pagina_origem: z.string().trim().max(200).optional(),
});

/**
 * Mapeamento de extensão detectada por Magic Bytes para o Content-Type canônico.
 */
export const CANONICAL_MIME_BY_EXT: Readonly<
  Record<"pdf" | "jpg" | "png" | "webp", string>
> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

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
export function validateImageMagicBytes(
  buffer: Buffer
): "jpg" | "png" | "webp" | null {
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
