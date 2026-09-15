import "server-only";

/**
 * Rate limiter em memoria, com janela deslizante.
 *
 * Suficiente para proteger o login de um unico Web Service no Render.
 * Se um dia houver mais de uma instancia, trocar por Redis/Upstash -
 * a interface abaixo foi mantida pequena justamente para facilitar isso.
 */

interface Attempt {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, Attempt>();

const MAX_CLEANUP_ENTRIES = 10_000;

function cleanup(now: number) {
  if (attempts.size < MAX_CLEANUP_ENTRIES) return;
  for (const [key, value] of attempts) {
    if (value.resetAt <= now) attempts.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 5 * 60 * 1000,
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const existing = attempts.get(key);

  if (!existing || existing.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

export function resetRateLimit(key: string): void {
  attempts.delete(key);
}

/** Identificador aproximado do cliente, a partir dos headers de proxy. */
export function clientKeyFromHeaders(headers: Headers, prefix: string): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${prefix}:${ip}`;
}
