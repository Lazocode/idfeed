/**
 * @file rate-limit.ts
 * @description Mecanismo em memória para limitação de taxa de requisições (Rate Limiting) de autenticação.
 * Previne ataques de força bruta limitando tentativas sucessivas por identificador (e-mail/IP).
 * @module lib/rate-limit
 * @recommendedPath src/lib/rate-limit.ts
 */

/**
 * Mapa em memória armazenando tentativas por identificador e momento de expiração da janela.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Valida se um identificador excedeu o número máximo de tentativas de login permitidas.
 * Janela padrão: 15 minutos com tolerância máxima de 8 tentativas.
 *
 * @param identifier - Identificador único da tentativa (ex: "login:usuario@email.com").
 * @returns `true` se a tentativa for permitida; `false` se o limite foi atingido.
 */
export function checkLoginRateLimit(identifier: string): boolean {
  const now = Date.now();
  const current = attempts.get(identifier);

  // Se não existir registro ou a janela de tempo tiver expirado, inicializa novo ciclo
  if (!current || current.resetAt <= now) {
    attempts.set(identifier, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }

  // Se o contador excedeu o teto de 8 tentativas bloqueia a operação
  if (current.count >= 8) return false;

  // Incrementa a contagem de tentativas na janela corrente
  current.count += 1;
  return true;
}

/**
 * Limpa o histórico de rate limit de um identificador após uma operação bem-sucedida.
 *
 * @param identifier - Identificador único (ex: "login:usuario@email.com").
 */
export function clearLoginRateLimit(identifier: string): void {
  attempts.delete(identifier);
}

