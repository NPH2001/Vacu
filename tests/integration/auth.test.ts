import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

const cookieStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  headers: async () => new Map<string, string>([['host', 'localhost:3000']]),
  cookies: async () => ({
    get: (k: string) => cookieStore.has(k) ? { value: cookieStore.get(k)! } : undefined,
    set: (k: string, v: string) => { cookieStore.set(k, v); },
    delete: (k: string) => { cookieStore.delete(k); },
  }),
}));

let ctx: TestDb;

beforeAll(async () => {
  ctx = await bootPg();
  const { db } = await import('@/db/client');
  const { users } = await import('@/db/schema');
  const { hashPassword } = await import('@/lib/auth');

  await db.insert(users).values([
    { email: 'admin@vacu.com.vn', name: 'Admin', role: 'admin',
      passwordHash: await hashPassword('adminpass123') },
    { email: 'staff@vacu.com.vn', name: 'Staff', role: 'staff',
      passwordHash: await hashPassword('staffpass123') },
  ]);
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

describe('signIn action', () => {
  it('returns error on wrong password', async () => {
    cookieStore.clear();
    const { signIn } = await import('@/app/admin/actions/auth');
    const fd = new FormData();
    fd.set('email', 'admin@vacu.com.vn');
    fd.set('password', 'wrong');
    const res = await signIn(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('returns error on unknown email', async () => {
    cookieStore.clear();
    const { signIn } = await import('@/app/admin/actions/auth');
    const fd = new FormData();
    fd.set('email', 'nobody@vacu.com.vn');
    fd.set('password', 'whatever123');
    const res = await signIn(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('sets session cookie and redirects on success', async () => {
    cookieStore.clear();
    process.env.AUTH_SECRET = 'test-secret-that-is-long-enough-for-test';
    const { signIn } = await import('@/app/admin/actions/auth');
    const fd = new FormData();
    fd.set('email', 'admin@vacu.com.vn');
    fd.set('password', 'adminpass123');
    // success path throws NEXT_REDIRECT
    await expect(signIn(null, fd)).rejects.toThrow();
    expect(cookieStore.size).toBeGreaterThan(0);
  });
});

describe('verifyPassword / hashPassword', () => {
  it('hashes and verifies round-trip', async () => {
    const { hashPassword, verifyPassword } = await import('@/lib/auth');
    const hash = await hashPassword('hello world 123');
    expect(await verifyPassword('hello world 123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('produces different hashes for same input (salted)', async () => {
    const { hashPassword } = await import('@/lib/auth');
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
});
