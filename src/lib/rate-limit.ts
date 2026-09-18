/**
 * @file rate-limit.ts
 * @description Mecanismo defensivo de limitação de taxa de requisições (Rate Limiting) em memória.
 * Mitiga ataques de força bruta, enumeração de placas, harvesting de CPF e Denial of Service (DoS)
 * com janelas deslizantes parametrizadas e limpeza automática de chaves expiradas para evitar vazamento de memória.
 * @module lib/rate-limit
 * @recommendedPath src/lib/rate-limit.ts
 */

/**
 * Interface representando o registro de tentativas de uma chave.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * Mapa em memória armazenando tentativas por identificador e momento de expiração da janela.
 * MITIGAÇÃO: Memory Exhaustion DoS por inserção massiva de chaves aleatórias.
 */
const attempts = new Map<string, RateLimitEntry>();

/**
 * Limite máximo de entradas mantidas simultaneamente no mapa para conter DoS de memória.
 */
const MAX_MAP_ENTRIES = 10_000;

/**
 * Remove registros com janelas temporais expiradas para liberar memória do processo.
 */
function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of attempts.entries()) {
    if (entry.resetAt <= now) {
      attempts.delete(key);
    }
  }
}

/**
 * Limite de taxa genérico parametrizado por chave, teto de requisições e janela temporal.
 *
 * MITIGAÇÃO: Ataques de Força Bruta, Scraping e Negação de Serviço Distribuída.
 * COMPORTAMENTO DEFENSIVO: Se o número de requisições atingir o limite na janela, retorna `false`,
 * permitindo que a camada chamadora rejeite a operação imediatamente sem onerar o banco ou serviços externos.
 *
 * @param identifier - Chave única (ex: "login:email@dominio.com", "search:placa:ABC1234").
 * @param maxAttempts - Número máximo de requisições permitidas na janela.
 * @param windowMs - Duração da janela temporal em milissegundos.
 * @returns `true` se a requisição estiver dentro da cota; `false` se a cota foi estourada.
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();

  // Se o mapa crescer além do limite de segurança, executa limpeza preemptiva
  if (attempts.size > MAX_MAP_ENTRIES) {
    pruneExpiredEntries();
  }

  const current = attempts.get(identifier);

  // Se não existir registro ou a janela de tempo tiver expirado, inicializa novo ciclo
  if (!current || current.resetAt <= now) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  // Se o contador excedeu o teto de tentativas bloqueia a operação
  if (current.count >= maxAttempts) {
    return false;
  }

  // Incrementa a contagem de tentativas na janela corrente
  current.count += 1;
  return true;
}

/**
 * Valida se um identificador excedeu o número máximo de tentativas de login permitidas.
 * Janela padrão: 15 minutos com tolerância máxima de 5 tentativas.
 *
 * MITIGAÇÃO: Ataques de Força Bruta e Credential Stuffing contra credenciais de login.
 * COMPORTAMENTO DEFENSIVO: Retorna `false` após 5 falhas, bloqueando autenticação até expiração da janela.
 *
 * @param identifier - Identificador único da tentativa (ex: "login:usuario@email.com").
 * @returns `true` se a tentativa for permitida; `false` se o limite foi atingido.
 */
export function checkLoginRateLimit(identifier: string): boolean {
  return checkRateLimit(identifier, 5, 15 * 60 * 1000);
}

/**
 * Limita a taxa de consultas públicas de prontuário veicular por IP e placa.
 * Janela: 1 minuto com tolerância de até 8 consultas.
 *
 * MITIGAÇÃO: Ataques de Força Bruta contra o HMAC do CPF do proprietário e enumeração massiva de placas.
 * COMPORTAMENTO DEFENSIVO: Interrompe a consulta no servidor antes de computar HMACs ou consultar o Supabase,
 * neutralizando ataques de exaustão de CPU e adivinhação de CPF.
 *
 * @param identifier - Identificador único (ex: "search:ip:1.2.3.4" ou "search:placa:ABC1234").
 * @returns `true` se a consulta for permitida; `false` se exceder o teto.
 */
export function checkPublicSearchRateLimit(identifier: string): boolean {
  return checkRateLimit(identifier, 8, 60 * 1000);
}

/**
 * Limita a criação de contas de oficinas e usuários por endereço de IP.
 * Janela: 1 hora com tolerância máxima de 3 cadastros.
 *
 * MITIGAÇÃO: Ataques de DoS via processamento repetido de hashes bcrypt (custo 12) e criação de contas fantasmas.
 * COMPORTAMENTO DEFENSIVO: Rejeita tentativas excedentes sem executar hashing de senhas.
 *
 * @param identifier - Identificador da origem (ex: "signup:ip:1.2.3.4").
 * @returns `true` se a tentativa for permitida; `false` se o limite foi atingido.
 */
export function checkSignupRateLimit(identifier: string): boolean {
  return checkRateLimit(identifier, 3, 60 * 60 * 1000);
}

/**
 * Limita o envio de arquivos e uploads por usuário/loja.
 * Janela: 5 minutos com tolerância de 20 uploads.
 *
 * MITIGAÇÃO: DoS de armazenamento (Storage Exhaustion) e bombardeio de upload.
 *
 * @param identifier - Identificador do usuário/loja (ex: "upload:loja:UUID").
 * @returns `true` se o upload for autorizado; `false` se exceder o limite.
 */
export function checkUploadRateLimit(identifier: string): boolean {
  return checkRateLimit(identifier, 20, 5 * 60 * 1000);
}

/**
 * Limpa o histórico de rate limit de um identificador após uma operação bem-sucedida.
 *
 * @param identifier - Identificador único (ex: "login:usuario@email.com").
 */
export function clearLoginRateLimit(identifier: string): void {
  attempts.delete(identifier);
}


