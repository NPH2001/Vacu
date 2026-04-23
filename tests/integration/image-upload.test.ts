import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

let tmpUploads: string;
let authed = false;

vi.mock('@/lib/session', () => ({
  getCurrentUser: async () => authed
    ? { id: 'u1', email: 'a@b.com', name: 'A', role: 'admin' }
    : null,
  requireAdmin: async () => {
    if (!authed) throw new Error('unauthorized');
    return { id: 'u1', email: 'a@b.com', name: 'A', role: 'admin' };
  },
  SESSION_COOKIE: 'ntx_session',
  setSessionCookie: async () => {},
  clearSessionCookie: async () => {},
  getSession: async () => null,
  requireRole: async () => { throw new Error('n/a'); },
}));

beforeAll(() => {
  tmpUploads = mkdtempSync(path.join(tmpdir(), 'vacu-test-uploads-'));
  process.env.UPLOADS_DIR = tmpUploads;
});

afterAll(() => {
  if (tmpUploads && existsSync(tmpUploads)) rmSync(tmpUploads, { recursive: true, force: true });
});

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
