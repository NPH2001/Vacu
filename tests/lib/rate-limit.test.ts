import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows up to the limit, then blocks within the window', () => {
    const key = `t-${Math.round(performance.now())}-a`;
    const opts = { limit: 3, windowMs: 60_000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    const blocked = rateLimit(key, opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it('keys are independent', () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const a = `t-${Math.round(performance.now())}-x`;
    const b = `t-${Math.round(performance.now())}-y`;
    expect(rateLimit(a, opts).ok).toBe(true);
    expect(rateLimit(b, opts).ok).toBe(true); // different key, not blocked
    expect(rateLimit(a, opts).ok).toBe(false);
  });

  it('resets after the window elapses', () => {
    // Use a comfortably-sized window (30ms) and spin well past it (60ms). The
    // old 1ms window was flaky under parallel test load: the two setup calls
    // could straddle a >1ms scheduling gap, so the second saw a fresh window.
    const key = `t-${Math.round(performance.now())}-w`;
    const opts = { limit: 1, windowMs: 30 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(false);
    const start = Date.now();
    while (Date.now() - start < 60) { /* spin past the 30ms window */ }
    expect(rateLimit(key, opts).ok).toBe(true);
  });
});
