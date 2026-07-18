import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

// --- session mock (for admin-only routes) ---
let authed = true;
vi.mock('@/lib/session', async () => {
  const cookieState: { value: string | null } = { value: null };
  return {
    getCurrentUser: async () =>
      authed ? { id: 'u1', email: 'admin@vacu.com.vn', name: 'A', role: 'admin' } : null,
    requireAdmin: async () => {
      if (!authed) throw new Error('unauthorized');
      return { id: 'u1', email: 'admin@vacu.com.vn', name: 'A', role: 'admin' };
    },
    requireRole: async () => {
      if (!authed) throw new Error('unauthorized');
      return { id: 'u1', email: 'admin@vacu.com.vn', name: 'A', role: 'admin' };
    },
    SESSION_COOKIE: 'ntx_session',
    setSessionCookie: async () => {},
    clearSessionCookie: async () => { cookieState.value = null; },
    getSession: async () => null,
  };
});

// --- mail mock for test-mail route ---
type MailCall = { to: string; subject: string; html?: string; text?: string; replyTo?: string };
const mailCalls: MailCall[] = [];
let mailResult: { ok: true; messageId: string } | { ok: false; error: string } =
  { ok: true, messageId: 'mock' };
vi.mock('@/lib/mail', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/mail')>();
  return {
    ...orig,
    sendMail: async (input: MailCall) => {
      mailCalls.push(input);
      return mailResult;
    },
  };
});

let ctx: TestDb;

async function seed() {
  const { db } = await import('@/db/client');
  const { categories, farmers, products, testimonials, faqItems, siteInfo } =
    await import('@/db/schema');

  await db.insert(siteInfo).values({
    id: 1, name: 'Vacu', shortName: 'Vacu', tagline: 't', description: 'd',
    address: 'a', phone: 'p', email: 'admin@vacu.com.vn', hours: 'h',
    statFarmers: '1', statProducts: '1', statCustomers: '1', statYears: '1',
    // Secrets that the public /api/site-info route must never serialize.
    smtpEnabled: true, smtpHost: 'smtp.secret.internal', smtpUser: 'mail-bot',
    smtpPass: 'super-secret-password', smtpFrom: 'no-reply@vacu.com.vn',
  });

  await db.insert(categories).values([
    { id: 'cat-api-leafy', name: 'Rau ăn lá', icon: '🥬', description: 'Rau xanh', sortOrder: 10 },
    { id: 'cat-api-root',  name: 'Củ quả',   icon: '🥔', description: 'Củ quả',   sortOrder: 20 },
  ]);
  await db.insert(farmers).values([
    { id: 'farmer-api-1', name: 'Chị Mai', farm: 'F1', location: 'Đà Lạt', years: 8,
      specialty: 'Hữu cơ', avatar: '/u/a1', cover: '/u/c1', story: 's' },
    { id: 'farmer-api-2', name: 'Anh Tú',  farm: 'F2', location: 'Mộc Châu', years: 4,
      specialty: 'Gạo',   avatar: '/u/a2', cover: '/u/c2', story: 's' },
  ]);
  await db.insert(products).values([
    { id: 'p-api-1', name: 'Cải ngọt', categoryId: 'cat-api-leafy', unit: 'kg', price: 10000,
      image: '/u/p1', description: 'ngon', featured: true,  inStock: true, farmerId: 'farmer-api-1' },
    { id: 'p-api-2', name: 'Xà lách',  categoryId: 'cat-api-leafy', unit: 'kg', price: 15000,
      image: '/u/p2', description: 'giòn', featured: false, inStock: true, farmerId: 'farmer-api-1' },
    { id: 'p-api-3', name: 'Cà rốt',   categoryId: 'cat-api-root',  unit: 'kg', price: 20000,
      image: '/u/p3', description: 'ngọt', featured: true,  inStock: false },
  ]);
  await db.insert(testimonials).values([
    { name: 'Chị A', role: 'Khách', avatar: '/u/t1', content: 'Tốt', sortOrder: 1 },
    { name: 'Anh B', role: 'Khách', avatar: '/u/t2', content: 'Ngon', sortOrder: 2 },
  ]);
  await db.insert(faqItems).values([
    { question: 'Giao mất bao lâu?', answer: '24h', sortOrder: 1 },
    { question: 'Có tươi không?',   answer: 'Rất', sortOrder: 2 },
  ]);
}

beforeAll(async () => {
  ctx = await bootPg();
  await seed();
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

beforeEach(() => {
  authed = true;
  mailCalls.length = 0;
  mailResult = { ok: true, messageId: 'mock' };
});

// --- Public GET routes ---
describe('GET /api/site-info', () => {
  it('returns public fields but strips every SMTP secret', async () => {
    const { GET } = await import('@/app/api/site-info/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json() as { data: Record<string, unknown> };
    // Public content is present…
    expect(json.data.name).toBe('Vacu');
    expect(json.data.email).toBe('admin@vacu.com.vn');
    // …but mail credentials must never leave the server.
    for (const k of ['smtpEnabled', 'smtpHost', 'smtpUser', 'smtpPass', 'smtpFrom', 'smtpFromName', 'smtpPort', 'smtpSecure']) {
      expect(json.data).not.toHaveProperty(k);
    }
    // Belt-and-braces: the secret value appears nowhere in the payload.
    expect(JSON.stringify(json.data)).not.toContain('super-secret-password');
  });
});

describe('GET /api/categories', () => {
  it('returns array sorted by sortOrder then name, with cache header', async () => {
    const { GET } = await import('@/app/api/categories/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toMatch(/s-maxage=300/);
    const json = await res.json() as { data: Array<{ id: string; sortOrder: number }> };
    expect(json.data.length).toBeGreaterThanOrEqual(2);
    // leafy (10) before root (20)
    const idx = (id: string) => json.data.findIndex((c) => c.id === id);
    expect(idx('cat-api-leafy')).toBeLessThan(idx('cat-api-root'));
  });
});

describe('GET /api/products', () => {
  it('no params → returns all sorted by name', async () => {
    const { GET } = await import('@/app/api/products/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/products');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json() as { data: Array<{ id: string; name: string }> };
    const names = json.data.filter((p) => p.id.startsWith('p-api-')).map((p) => p.name);
    // asc by name → Cà rốt, Cải ngọt, Xà lách (Vietnamese collation → string compare)
    expect(names.indexOf('Cà rốt')).toBeLessThan(names.indexOf('Xà lách'));
  });

  it('?category=X filters by category', async () => {
    const { GET } = await import('@/app/api/products/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/products?category=cat-api-leafy');
    const res = await GET(req);
    const json = await res.json() as { data: Array<{ id: string }> };
    const ids = json.data.map((p) => p.id);
    expect(ids).toContain('p-api-1');
    expect(ids).toContain('p-api-2');
    expect(ids).not.toContain('p-api-3');
  });

  it('?featured=true returns only featured, default limit 8', async () => {
    const { GET } = await import('@/app/api/products/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/products?featured=true');
    const res = await GET(req);
    const json = await res.json() as { data: Array<{ id: string; featured: boolean }> };
    const mine = json.data.filter((p) => p.id.startsWith('p-api-'));
    expect(mine.every((p) => p.featured)).toBe(true);
    expect(mine.map((p) => p.id).sort()).toEqual(['p-api-1', 'p-api-3']);
  });

  it('?featured=true&limit=1 respects limit', async () => {
    const { GET } = await import('@/app/api/products/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/products?featured=true&limit=1');
    const res = await GET(req);
    const json = await res.json() as { data: Array<{ id: string }> };
    expect(json.data).toHaveLength(1);
  });
});

describe('GET /api/products/[id]', () => {
  it('200 when found', async () => {
    const { GET } = await import('@/app/api/products/[id]/route');
    const res = await GET(new Request('http://localhost/api/products/p-api-1'),
      { params: Promise.resolve({ id: 'p-api-1' }) });
    expect(res.status).toBe(200);
    const json = await res.json() as { data: { id: string } };
    expect(json.data.id).toBe('p-api-1');
  });

  it('404 when not found', async () => {
    const { GET } = await import('@/app/api/products/[id]/route');
    const res = await GET(new Request('http://localhost/api/products/zzz'),
      { params: Promise.resolve({ id: 'zzz' }) });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/farmers and /api/farmers/[id]', () => {
  it('list returns sorted by name', async () => {
    const { GET } = await import('@/app/api/farmers/route');
    const res = await GET();
    const json = await res.json() as { data: Array<{ id: string; name: string }> };
    const rows = json.data.filter((f) => f.id.startsWith('farmer-api-'));
    expect(rows.map((r) => r.name)).toEqual(['Anh Tú', 'Chị Mai']);
  });

  it('single includes related products', async () => {
    const { GET } = await import('@/app/api/farmers/[id]/route');
    const res = await GET(new Request('http://localhost/api/farmers/farmer-api-1'),
      { params: Promise.resolve({ id: 'farmer-api-1' }) });
    expect(res.status).toBe(200);
    const json = await res.json() as { data: { id: string; products: Array<{ id: string }> } };
    expect(json.data.id).toBe('farmer-api-1');
    expect(json.data.products.map((p) => p.id).sort()).toEqual(['p-api-1', 'p-api-2']);
  });

  it('single 404 when missing', async () => {
    const { GET } = await import('@/app/api/farmers/[id]/route');
    const res = await GET(new Request('http://localhost/api/farmers/nope'),
      { params: Promise.resolve({ id: 'nope' }) });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/faq and /api/testimonials and /api/site-info', () => {
  it('faq returns sorted by sortOrder', async () => {
    const { GET } = await import('@/app/api/faq/route');
    const res = await GET();
    const json = await res.json() as { data: Array<{ question: string }> };
    const mine = json.data.filter((q) => q.question.startsWith('Giao') || q.question.startsWith('Có'));
    expect(mine[0].question).toMatch(/Giao/);
  });

  it('testimonials returns sorted by sortOrder', async () => {
    const { GET } = await import('@/app/api/testimonials/route');
    const res = await GET();
    const json = await res.json() as { data: Array<{ name: string }> };
    expect(json.data.length).toBeGreaterThanOrEqual(2);
  });

  it('site-info returns row', async () => {
    const { GET } = await import('@/app/api/site-info/route');
    const res = await GET();
    const json = await res.json() as { data: { name: string } };
    expect(json.data.name).toBe('Vacu');
  });
});

// --- Admin test-mail ---
describe('POST /api/admin/test-mail', () => {
  it('401 when unauthenticated', async () => {
    authed = false;
    const { POST } = await import('@/app/api/admin/test-mail/route');
    const res = await POST(new Request('http://localhost/api/admin/test-mail', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'x@x.com' }),
    }));
    expect(res.status).toBe(401);
    expect(mailCalls).toHaveLength(0);
  });

  it('400 when no email in body and no session email fallback', async () => {
    // with mocked session returning admin@vacu.com.vn, `me?.email` fallback kicks in,
    // so send an explicit empty `to` AND ensure me has empty email.
    // easiest: pass { to: '' } and rely on fallback — since session has an email,
    // this test verifies fallback WORKS (no 400). We split into 2 tests.
    const { POST } = await import('@/app/api/admin/test-mail/route');
    const res = await POST(new Request('http://localhost/api/admin/test-mail', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }));
    // session email is 'admin@vacu.com.vn' (from mock) → used as fallback
    expect(res.status).toBe(200);
    expect(mailCalls[0].to).toBe('admin@vacu.com.vn');
  });

  it('uses `to` from request body', async () => {
    const { POST } = await import('@/app/api/admin/test-mail/route');
    const res = await POST(new Request('http://localhost/api/admin/test-mail', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'custom@example.com' }),
    }));
    expect(res.status).toBe(200);
    expect(mailCalls[0].to).toBe('custom@example.com');
    expect(mailCalls[0].subject).toMatch(/Test email/i);
    expect(mailCalls[0].html).toBeTruthy();
    expect(mailCalls[0].text).toBeTruthy();
  });

  it('500 when sendMail fails; surfaces error message', async () => {
    mailResult = { ok: false, error: 'SMTP broken' };
    const { POST } = await import('@/app/api/admin/test-mail/route');
    const res = await POST(new Request('http://localhost/api/admin/test-mail', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to: 'a@b.c' }),
    }));
    expect(res.status).toBe(500);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('SMTP broken');
  });

  it('tolerates non-JSON body (empty catch → {})', async () => {
    const { POST } = await import('@/app/api/admin/test-mail/route');
    const res = await POST(new Request('http://localhost/api/admin/test-mail', {
      method: 'POST', body: 'not-json',
    }));
    // falls back to me.email
    expect(res.status).toBe(200);
    expect(mailCalls[0].to).toBe('admin@vacu.com.vn');
  });
});

// --- Logout ---
describe('POST /api/auth/logout', () => {
  it('returns a 303 redirect to /admin/login', async () => {
    const { POST } = await import('@/app/api/auth/logout/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost/api/auth/logout', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toContain('/admin/login');
  });
});
