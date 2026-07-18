import 'server-only';
import { headers } from 'next/headers';

/**
 * A tiny in-memory fixed-window rate limiter. It is per-process, so it protects
 * a single-instance deployment (the current Docker setup); a horizontally-scaled
 * deployment would need a shared store (Redis). Good enough to stop online
 * brute-force, reset-email flooding, and upload hammering from one box.
 */
type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const e = buckets.get(key);
  if (!e || e.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return { ok: true, retryAfterSec: 0 };
  }
  if (e.count >= limit) return { ok: false, retryAfterSec: Math.ceil((e.resetAt - now) / 1000) };
  e.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/**
 * Best-effort client IP for rate-limiting.
 *
 * X-Forwarded-For is `client, proxy1, proxy2, …` where each proxy APPENDS the
 * address it saw. Everything a proxy didn't add is client-controlled — so the
 * *leftmost* token is attacker-supplied and reading it (the naive `[0]`) lets an
 * attacker put a fresh fake IP on every request and never trip the limiter.
 * Only the rightmost entries, appended by our own trusted proxies, are reliable.
 *
 * Read the entry `TRUSTED_PROXY_HOPS` positions from the right (default 1, i.e.
 * a single ingress like Traefik in front of the app). Set it to the real number
 * of trusted proxies (e.g. 2 behind a CDN + ingress) so the value picked is the
 * one the outermost trusted hop recorded, not one the client injected.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    const hops = Math.max(1, Math.floor(Number(process.env.TRUSTED_PROXY_HOPS)) || 1);
    const ip = parts[parts.length - hops];
    if (ip) return ip;
  }
  return h.get('x-real-ip')?.trim() || 'unknown';
}
