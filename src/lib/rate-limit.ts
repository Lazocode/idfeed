const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(identifier: string) {
  const now = Date.now();
  const current = attempts.get(identifier);
  if (!current || current.resetAt <= now) {
    attempts.set(identifier, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (current.count >= 8) return false;
  current.count += 1;
  return true;
}
