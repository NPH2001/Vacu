import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

vi.mock('next/headers', () => ({
  headers: async () => new Map<string, string>([['host', 'localhost:3000']]),
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}));

const sendMailCalls: Array<{ to: string; subject: string; html?: string; text?: string }> = [];
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: async (opts: { to: string; subject: string; html?: string; text?: string }) => {
        sendMailCalls.push(opts);
        return { messageId: 'mock-id' };
      },
      verify: async () => true,
    }),
  },
}));

let ctx: TestDb;

beforeAll(async () => {
  ctx = await bootPg();
  const { db } = await import('@/db/client');
  const { siteInfo, users } = await import('@/db/schema');
  const { hashPassword } = await import('@/lib/auth');

  await db.insert(siteInfo).values({
    id: 1,
    name: 'Vacu',
    shortName: 'Vacu',
    tagline: 't',
    description: 'd',
    address: 'a',
    phone: 'p',
    email: 'admin@vacu.com.vn',
    hours: 'h',
    statFarmers: '1', statProducts: '1', statCustomers: '1', statYears: '1',
    smtpEnabled: true,
    smtpHost: 'smtp.test',
    smtpPort: 587,
    smtpFrom: 'noreply@vacu.com.vn',
  });

  await db.insert(users).values({
    email: 'user@vacu.com.vn',
    name: 'Test User',
    role: 'admin',
    passwordHash: await hashPassword('oldpassword123'),
  });
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

beforeEach(() => { sendMailCalls.length = 0; });

describe('requestPasswordReset', () => {
  it('returns generic OK for nonexistent email and sends no mail', async () => {
    const { requestPasswordReset } = await import('@/app/admin/actions/password-reset');
    const fd = new FormData();
    fd.set('email', 'nobody@example.com');
    const res = await requestPasswordReset(null, fd);
    expect(res?.ok).toBe(true);
    expect(sendMailCalls).toHaveLength(0);
  });

  it('rejects invalid email format', async () => {
    const { requestPasswordReset } = await import('@/app/admin/actions/password-reset');
    const fd = new FormData();
    fd.set('email', 'not-an-email');
    const res = await requestPasswordReset(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('creates token and sends email for real user', async () => {
    const { requestPasswordReset } = await import('@/app/admin/actions/password-reset');
    const { db } = await import('@/db/client');
    const { passwordResetTokens } = await import('@/db/schema');

    const fd = new FormData();
    fd.set('email', 'user@vacu.com.vn');
    const res = await requestPasswordReset(null, fd);
    expect(res?.ok).toBe(true);

    // The email is sent fire-and-forget (so response timing can't leak account
    // existence) — let the microtask flush before asserting.
    await new Promise((r) => setTimeout(r, 50));
    expect(sendMailCalls).toHaveLength(1);
    expect(sendMailCalls[0].to).toBe('user@vacu.com.vn');
    expect(sendMailCalls[0].subject).toContain('Vacu');
    expect(sendMailCalls[0].html).toContain('reset-password?token=');

    const tokens = await db.select().from(passwordResetTokens);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[tokens.length - 1].usedAt).toBeNull();
  });
});

describe('resetPassword', () => {
  async function seedToken(opts: { expiresIn: number; used?: boolean }) {
    const { db } = await import('@/db/client');
    const { passwordResetTokens, users } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { randomBytes, createHash } = await import('node:crypto');

    const [user] = await db.select().from(users).where(eq(users.email, 'user@vacu.com.vn')).limit(1);
    const raw = randomBytes(16).toString('base64url');
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    await db.insert(passwordResetTokens).values({
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + opts.expiresIn),
      usedAt: opts.used ? new Date() : null,
    });
    return raw;
  }

  it('resets password and marks token used', async () => {
    const raw = await seedToken({ expiresIn: 60_000 });
    const { resetPassword } = await import('@/app/admin/actions/password-reset');
    const { db } = await import('@/db/client');
    const { users, passwordResetTokens } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { verifyPassword } = await import('@/lib/auth');
    const { createHash } = await import('node:crypto');

    const fd = new FormData();
    fd.set('token', raw);
    fd.set('password', 'newpass12345');
    // resetPassword calls redirect() on success, which throws NEXT_REDIRECT
    await expect(resetPassword(null, fd)).rejects.toThrow();

    const [user] = await db.select().from(users).where(eq(users.email, 'user@vacu.com.vn')).limit(1);
    expect(await verifyPassword('newpass12345', user.passwordHash)).toBe(true);
    expect(await verifyPassword('oldpassword123', user.passwordHash)).toBe(false);

    const tokenHash = createHash('sha256').update(raw).digest('hex');
    const [t] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).limit(1);
    expect(t?.usedAt).not.toBeNull();
  });

  it('rejects already-used token', async () => {
    const raw = await seedToken({ expiresIn: 60_000, used: true });
    const { resetPassword } = await import('@/app/admin/actions/password-reset');
    const fd = new FormData();
    fd.set('token', raw);
    fd.set('password', 'anothernewpass');
    const res = await resetPassword(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects expired token', async () => {
    const raw = await seedToken({ expiresIn: -1000 }); // already expired
    const { resetPassword } = await import('@/app/admin/actions/password-reset');
    const fd = new FormData();
    fd.set('token', raw);
    fd.set('password', 'anothernewpass');
    const res = await resetPassword(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects invalid token', async () => {
    const { resetPassword } = await import('@/app/admin/actions/password-reset');
    const fd = new FormData();
    fd.set('token', 'a'.repeat(32));
    fd.set('password', 'newpassword999');
    const res = await resetPassword(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects short password', async () => {
    const raw = await seedToken({ expiresIn: 60_000 });
    const { resetPassword } = await import('@/app/admin/actions/password-reset');
    const fd = new FormData();
    fd.set('token', raw);
    fd.set('password', 'short');
    const res = await resetPassword(null, fd);
    expect(res?.error).toBeTruthy();
  });
});
