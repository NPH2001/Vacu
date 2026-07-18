import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

let tmpUploads: string;
let authed = false;
let ctx: TestDb;
// Set once the users row exists — uploads record who uploaded them.
const USER = { id: '', email: 'a@b.com', name: 'A', role: 'admin' as const };

vi.mock('@/lib/session', () => ({
  getCurrentUser: async () => (authed ? USER : null),
  requireAdmin: async () => {
    if (!authed) throw new Error('unauthorized');
    return USER;
  },
  SESSION_COOKIE: 'ntx_session',
  setSessionCookie: async () => {},
  clearSessionCookie: async () => {},
  getSession: async () => null,
  requireRole: async () => { throw new Error('n/a'); },
}));

// The upload route now records every file in the media library, so this needs a
// database as well as a scratch uploads directory.
beforeAll(async () => {
  tmpUploads = mkdtempSync(path.join(tmpdir(), 'vacu-test-uploads-'));
  process.env.UPLOADS_DIR = tmpUploads;

  ctx = await bootPg();
  const { db } = await import('@/db/client');
  const { users } = await import('@/db/schema');
  const [u] = await db.insert(users).values({
    email: 'a@b.com', passwordHash: 'x', name: 'A', role: 'admin',
  }).returning();
  USER.id = u.id;
}, 180_000);

afterAll(async () => {
  await stopPg(ctx);
  if (tmpUploads && existsSync(tmpUploads)) rmSync(tmpUploads, { recursive: true, force: true });
}, 60_000);

beforeEach(() => { authed = false; });

async function makePng(): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  return sharp({
    create: { width: 20, height: 20, channels: 4, background: { r: 200, g: 50, b: 80, alpha: 1 } },
  }).png().toBuffer();
}

function buildRequest(file: File): Request {
  const fd = new FormData();
  fd.set('file', file);
  return new Request('http://localhost/api/upload', { method: 'POST', body: fd });
}

describe('POST /api/upload', () => {
  it('returns 401 when unauthenticated', async () => {
    const { POST } = await import('@/app/api/upload/route');
    const png = await makePng();
    const res = await POST(buildRequest(new File([new Uint8Array(png)], 't.png', { type: 'image/png' })));
    expect(res.status).toBe(401);
  });

  it('saves PNG and returns URL when authenticated', async () => {
    authed = true;
    const { POST } = await import('@/app/api/upload/route');
    const png = await makePng();
    const res = await POST(buildRequest(new File([new Uint8Array(png)], 'ok.png', { type: 'image/png' })));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { url: string };
    expect(json.url).toMatch(/^\/uploads\//);
    expect(json.url).toMatch(/\.webp$/);

    // File exists under tmp uploads dir
    const rel = json.url.replace(/^\/uploads\//, '');
    expect(existsSync(path.join(tmpUploads, rel))).toBe(true);
  });

  it('records the upload in the media library so it can be re-used', async () => {
    authed = true;
    const { POST } = await import('@/app/api/upload/route');
    const { db } = await import('@/db/client');
    const { media } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const sharp = (await import('sharp')).default;
    // Wider than the 1200px cap, to check the stored size describes the
    // processed file rather than the original.
    const big = await sharp({
      create: { width: 2000, height: 1000, channels: 3, background: { r: 1, g: 2, b: 3 } },
    }).png().toBuffer();

    const res = await POST(buildRequest(new File([new Uint8Array(big)], 'rau tươi.png', { type: 'image/png' })));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { url: string };

    const [row] = await db.select().from(media).where(eq(media.url, json.url));
    expect(row).toBeDefined();
    expect(row.filename).toBe('rau tươi.png');
    expect(row.mime).toBe('image/webp');
    expect(row.width).toBe(1200);
    expect(row.height).toBe(600);
    expect(row.size).toBeGreaterThan(0);
    expect(row.uploadedBy).toBe(USER.id);
  });

  it('does not record a media row for a rejected upload', async () => {
    authed = true;
    const { POST } = await import('@/app/api/upload/route');
    const { db } = await import('@/db/client');
    const { media } = await import('@/db/schema');

    const before = await db.select().from(media);
    const res = await POST(buildRequest(new File(['hello'], 'bad.txt', { type: 'text/plain' })));
    expect(res.status).toBe(400);
    expect(await db.select().from(media)).toHaveLength(before.length);
  });

  it('rejects unsupported mime type', async () => {
    authed = true;
    const { POST } = await import('@/app/api/upload/route');
    const res = await POST(buildRequest(new File(['hello'], 't.txt', { type: 'text/plain' })));
    expect(res.status).toBe(400);
  });

  it('rejects file larger than 4MB', async () => {
    authed = true;
    const { POST } = await import('@/app/api/upload/route');
    const bigBuf = new Uint8Array(5 * 1024 * 1024); // 5MB zeros
    const res = await POST(buildRequest(new File([bigBuf], 'big.png', { type: 'image/png' })));
    expect(res.status).toBe(400);
  });

  it('rejects request with no file', async () => {
    authed = true;
    const { POST } = await import('@/app/api/upload/route');
    const req = new Request('http://localhost/api/upload', { method: 'POST', body: new FormData() });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
