import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signSession, verifySession } from '@/lib/auth';

describe('auth', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('hunter2!');
    expect(hash).not.toBe('hunter2!');
    expect(await verifyPassword('hunter2!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('signs and verifies a session token', async () => {
    process.env.AUTH_SECRET = 'a'.repeat(64);
    const jwt = await signSession({ sub: 'user-1', role: 'admin' });
    const payload = await verifySession(jwt);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('admin');
  });

  it('rejects a token signed by a different secret', async () => {
    process.env.AUTH_SECRET = 'a'.repeat(64);
    const jwt = await signSession({ sub: 'user-1', role: 'admin' });
    process.env.AUTH_SECRET = 'b'.repeat(64);
    await expect(verifySession(jwt)).rejects.toThrow();
  });
});
