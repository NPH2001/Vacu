import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

// clientIp() reads next/headers; mock it so we can drive X-Forwarded-For.
let xff: string | null = null;
let xRealIp: string | null = null;
vi.mock('next/headers', () => ({
  headers: async () => new Map<string, string>(
    [
      ...(xff !== null ? [['x-forwarded-for', xff] as [string, string]] : []),
      ...(xRealIp !== null ? [['x-real-ip', xRealIp] as [string, string]] : []),
    ],
  ),
}));

describe('clientIp — X-Forwarded-For trust', () => {
  beforeEach(() => { xff = null; xRealIp = null; delete process.env.TRUSTED_PROXY_HOPS; });
  afterEach(() => { delete process.env.TRUSTED_PROXY_HOPS; });

  it('with one trusted proxy (default), reads the rightmost entry, not the spoofable leftmost', async () => {
    const { clientIp } = await import('@/lib/rate-limit');
    // Attacker sends a fake left token; the proxy appends the real client IP.
    xff = '203.0.113.9, 198.51.100.7';
    expect(await clientIp()).toBe('198.51.100.7');
  });

  it('cannot be bypassed by rotating the leftmost token', async () => {
    const { clientIp } = await import('@/lib/rate-limit');
    xff = '0.0.0.1, 198.51.100.7';
    const first = await clientIp();
    xff = '0.0.0.2, 198.51.100.7';
    const second = await clientIp();
    expect(first).toBe(second); // same real client → same rate-limit bucket
  });

  it('honors TRUSTED_PROXY_HOPS for a deeper proxy chain', async () => {
    process.env.TRUSTED_PROXY_HOPS = '2';
    const { clientIp } = await import('@/lib/rate-limit');
    // client, realclient-as-seen-by-proxy1, proxy1-ip
    xff = 'spoofed, 198.51.100.7, 10.0.0.1';
    expect(await clientIp()).toBe('198.51.100.7');
  });

  it('falls back to x-real-ip, then unknown', async () => {
    const { clientIp } = await import('@/lib/rate-limit');
    xRealIp = '198.51.100.50';
    expect(await clientIp()).toBe('198.51.100.50');
    xRealIp = null;
    expect(await clientIp()).toBe('unknown');
  });
});
