type RateLimitEntry = { count: number; resetAt: number };
type RateLimitStore = Map<string, RateLimitEntry>;

const globalForRateLimit = globalThis as unknown as { rateLimitStore?: RateLimitStore };
const store = globalForRateLimit.rateLimitStore ?? new Map<string, RateLimitEntry>();
globalForRateLimit.rateLimitStore = store;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  nowMs: number = Date.now(),
): RateLimitResult {
  const existing = store.get(key);
  const entry = !existing || existing.resetAt <= nowMs
    ? { count: 0, resetAt: nowMs + windowMs }
    : existing;
  entry.count += 1;
  store.set(key, entry);
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - nowMs) / 1000)),
  };
}

export function clearRateLimitStore(): void {
  store.clear();
}
