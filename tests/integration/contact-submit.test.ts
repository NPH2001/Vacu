import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

type SendMailCall = {
  to: string;
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
};
const sendMailCalls: SendMailCall[] = [];
let sendMailResult: { ok: true; messageId: string } | { ok: false; error: string } =
  { ok: true, messageId: 'mock' };

vi.mock('@/lib/mail', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/mail')>();
  return {
    ...orig,
    sendMail: async (input: SendMailCall) => {
      sendMailCalls.push(input);
      return sendMailResult;
    },
  };
});

let ctx: TestDb;

async function setSiteInfo(opts: { exists: boolean; smtpEnabled: boolean; email?: string }) {
  const { db } = await import('@/db/client');
  const { siteInfo } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  await db.delete(siteInfo).where(eq(siteInfo.id, 1));
  if (opts.exists) {
    await db.insert(siteInfo).values({
      id: 1, name: 'Vacu', shortName: 'Vacu', tagline: 't', description: 'd',
      address: 'a', phone: 'p', email: opts.email ?? 'contact@vacu.com.vn', hours: 'h',
      statFarmers: '1', statProducts: '1', statCustomers: '1', statYears: '1',
      smtpEnabled: opts.smtpEnabled,
      smtpHost: 'smtp.test', smtpPort: 587, smtpFrom: 'noreply@vacu.com.vn',
    });
  }
}

function goodForm(over: Partial<Record<'name' | 'phone' | 'email' | 'topic' | 'message', string>> = {}) {
  const fd = new FormData();
  fd.set('name', over.name ?? 'Nguyễn Văn A');
  fd.set('phone', over.phone ?? '0987654321');
  fd.set('email', over.email ?? 'cust@example.com');
  fd.set('topic', over.topic ?? 'Đặt hàng');
  fd.set('message', over.message ?? 'Tôi cần tư vấn hộp rau tuần.');
  return fd;
}

beforeAll(async () => { ctx = await bootPg(); }, 120_000);
afterAll(async () => { await stopPg(ctx); });
beforeEach(() => {
  sendMailCalls.length = 0;
  sendMailResult = { ok: true, messageId: 'mock' };
});

describe('submitContact validation', () => {
  beforeEach(() => setSiteInfo({ exists: true, smtpEnabled: true }));

  it('rejects invalid email', async () => {
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm({ email: 'not-an-email' }));
    expect(res).toMatchObject({ ok: false });
    expect(sendMailCalls).toHaveLength(0);
  });

  it('rejects short phone (<6)', async () => {
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm({ phone: '12345' }));
    expect(res).toMatchObject({ ok: false });
  });

  it('rejects empty name / topic / message', async () => {
    const { submitContact } = await import('@/app/(public)/contact/actions');
    expect((await submitContact(goodForm({ name: '' }))).ok).toBe(false);
    expect((await submitContact(goodForm({ topic: '' }))).ok).toBe(false);
    expect((await submitContact(goodForm({ message: '' }))).ok).toBe(false);
    expect(sendMailCalls).toHaveLength(0);
  });

  it('rejects oversize message (>2000)', async () => {
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm({ message: 'x'.repeat(2001) }));
    expect(res.ok).toBe(false);
  });
});

describe('submitContact site_info gating', () => {
  it('returns specific error when site_info row missing', async () => {
    await setSiteInfo({ exists: false, smtpEnabled: false });
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm());
    expect(res).toEqual({ ok: false, error: 'Site chưa khởi tạo.' });
    expect(sendMailCalls).toHaveLength(0);
  });

  it('returns specific error when smtpEnabled=false', async () => {
    await setSiteInfo({ exists: true, smtpEnabled: false });
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm());
    expect(res).toEqual({ ok: false, error: 'Chưa cấu hình gửi mail. Admin vui lòng kiểm tra.' });
    expect(sendMailCalls).toHaveLength(0);
  });
});

describe('submitContact happy path and HTML escape', () => {
  beforeEach(() => setSiteInfo({ exists: true, smtpEnabled: true, email: 'inbox@vacu.com.vn' }));

  it('returns { ok: true } and calls sendMail with proper fields', async () => {
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm());
    expect(res).toEqual({ ok: true });

    expect(sendMailCalls).toHaveLength(1);
    const c = sendMailCalls[0];
    expect(c.to).toBe('inbox@vacu.com.vn');
    expect(c.replyTo).toBe('cust@example.com');
    expect(c.subject).toBe('[Vacu liên hệ] Đặt hàng — Nguyễn Văn A');
    expect(c.html).toContain('Nguyễn Văn A');
    expect(c.text).toContain('0987654321');
  });

  it('escapes HTML entities (no XSS from submitted fields)', async () => {
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm({
      name: 'A<script>alert(1)</script>B',
      topic: 'Bug & "quoted"',
      message: "Line1\n<img src=x onerror=alert(2)>\nIt's broken",
    }));
    expect(res.ok).toBe(true);

    const html = sendMailCalls[0].html ?? '';
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x onerror=');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Bug &amp; &quot;quoted&quot;');
    expect(html).toContain('&lt;img src=x onerror=alert(2)&gt;');
    expect(html).toContain('It&#39;s broken');
  });

  it('surfaces sendMail error as { ok: false, error }', async () => {
    sendMailResult = { ok: false, error: 'SMTP down' };
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm());
    expect(res).toEqual({ ok: false, error: 'SMTP down' });
  });

  it('max-length fields pass at exact boundaries', async () => {
    const { submitContact } = await import('@/app/(public)/contact/actions');
    const res = await submitContact(goodForm({
      name: 'n'.repeat(120),
      topic: 't'.repeat(120),
      message: 'm'.repeat(2000),
      email: 'a@' + 'b'.repeat(180) + '.co', // <= 200
    }));
    expect(res.ok).toBe(true);
  });

  it('plaintext fallback includes all submitted fields', async () => {
    const { submitContact } = await import('@/app/(public)/contact/actions');
    await submitContact(goodForm({
      name: 'Chị Lan', phone: '0911222333', email: 'lan@example.com',
      topic: 'Tour vườn', message: 'Tôi muốn tham quan.',
    }));
    const t = sendMailCalls[0].text ?? '';
    expect(t).toContain('Chị Lan');
    expect(t).toContain('0911222333');
    expect(t).toContain('lan@example.com');
    expect(t).toContain('Tour vườn');
    expect(t).toContain('Tôi muốn tham quan.');
  });
});
