/**
 * 인메모리 Rate Limiter
 *
 * Vercel 서버리스 환경에서는 인스턴스별로 독립적으로 동작합니다.
 * 인스턴스 간 공유가 필요하다면 Redis(Upstash) 기반으로 교체하세요.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 만료된 엔트리를 주기적으로 정리
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000);

/**
 * @param key     식별자 (IP + endpoint 조합 권장)
 * @param limit   윈도우 내 허용 횟수
 * @param windowMs 윈도우 크기 (밀리초)
 * @returns { ok: true } 또는 { ok: false, retryAfterMs: number }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

/** NextRequest에서 IP 추출 */
export function getIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}
