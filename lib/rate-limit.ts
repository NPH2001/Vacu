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

/** Best-effort client IP from proxy headers (Traefik sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim()
    || h.get('x-real-ip')?.trim()
    || 'unknown';
}
