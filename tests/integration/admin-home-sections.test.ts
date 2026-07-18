import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

// This action returns state instead of redirecting, so revalidatePath has to be
// stubbed — outside a request it throws before the return value is reached.
vi.mock('next/cache', () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));

let authed = true;
const ADMIN = { id: 'u1', email: 'a@b.com', name: 'A', role: 'admin' as const };

vi.mock('@/lib/session', () => ({
  getCurrentUser: async () => (authed ? ADMIN : null),
  requireAdmin: async () => {
    if (!authed) throw new Error('unauthorized');
    return ADMIN;
  },
  requireRole: async () => {
    if (!authed) throw new Error('unauthorized');
    return ADMIN;
  },
  SESSION_COOKIE: 'ntx_session',
  setSessionCookie: async () => {},
  clearSessionCookie: async () => {},
  getSession: async () => null,
}));

let ctx: TestDb;
beforeAll(async () => { ctx = await bootPg(); }, 180_000);
afterAll(async () => { await stopPg(ctx); }, 60_000);

function form(sections: Array<{ key: string; visible: boolean }>): FormData {
  const fd = new FormData();
  fd.set('sections', JSON.stringify(sections));
  return fd;
}

describe('getHomeSectionOrder', () => {
  it('lists every known section as visible when the table is empty', async () => {
    const { getHomeSectionOrder } = await import('@/lib/data');
    const { DEFAULT_ORDER } = await import('@/lib/home-sections');

    // A fresh install has no rows; the homepage must still render in full
    // rather than come up blank.
    const order = await getHomeSectionOrder();
    expect(order.map((s) => s.key)).toEqual(DEFAULT_ORDER);
    expect(order.every((s) => s.visible)).toBe(true);
  });

  it('backfills a section the database has never seen, without losing stored order', async () => {
    const { db } = await import('@/db/client');
    const { homeSections } = await import('@/db/schema');
    const { getHomeSectionOrder } = await import('@/lib/data');
    const { DEFAULT_ORDER } = await import('@/lib/home-sections');

    // Simulates an install that saved its order before a later release added
    // more sections: only two rows exist.
    await db.insert(homeSections).values([
      { key: 'featured', visible: true, sortOrder: 0 },
      { key: 'hero', visible: true, sortOrder: 10 },
    ]);

    const order = await getHomeSectionOrder();
    // Stored rows keep their order...
    expect(order.slice(0, 2).map((s) => s.key)).toEqual(['featured', 'hero']);
    // ...and the unknown-to-the-db ones are appended, visible, so nothing
    // silently disappears from the homepage.
    expect(order).toHaveLength(DEFAULT_ORDER.length);
    expect(order.every((s) => s.visible)).toBe(true);

    await db.delete(homeSections);
  });

  it('ignores a stale key left in the database', async () => {
    const { db } = await import('@/db/client');
    const { homeSections } = await import('@/db/schema');
    const { getHomeSectionOrder } = await import('@/lib/data');
    const { DEFAULT_ORDER } = await import('@/lib/home-sections');

    // A section removed from the code must not reach the page's section map,
    // where it would render as undefined.
    await db.insert(homeSections).values({ key: 'khoi-da-go-bo', visible: true, sortOrder: 0 });

    const order = await getHomeSectionOrder();
    expect(order.map((s) => s.key)).not.toContain('khoi-da-go-bo');
    expect(order).toHaveLength(DEFAULT_ORDER.length);

    await db.delete(homeSections);
  });
});

describe('saveHomeSections', () => {
  it('persists order and visibility', async () => {
    const { saveHomeSections } = await import('@/app/admin/actions/home-sections');
    const { getHomeSectionOrder } = await import('@/lib/data');

    const res = await saveHomeSections(null, form([
      { key: 'faq', visible: true },
      { key: 'hero', visible: false },
      { key: 'featured', visible: true },
    ]));
    expect(res).toEqual({ ok: true });

    const order = await getHomeSectionOrder();
    expect(order.slice(0, 3).map((s) => s.key)).toEqual(['faq', 'hero', 'featured']);
    expect(order.find((s) => s.key === 'hero')?.visible).toBe(false);

    const { db } = await import('@/db/client');
    const { homeSections } = await import('@/db/schema');
    await db.delete(homeSections);
  });

  it('re-saving updates rows in place rather than wiping and re-adding', async () => {
    const { saveHomeSections } = await import('@/app/admin/actions/home-sections');
    const { getHomeSectionOrder } = await import('@/lib/data');

    await saveHomeSections(null, form([{ key: 'hero', visible: false }]));
    await saveHomeSections(null, form([{ key: 'hero', visible: true }]));

    const order = await getHomeSectionOrder();
    expect(order.find((s) => s.key === 'hero')?.visible).toBe(true);

    const { db } = await import('@/db/client');
    const { homeSections } = await import('@/db/schema');
    // Upsert, not delete-then-insert: exactly one row per key.
    expect(await db.select().from(homeSections)).toHaveLength(1);
    await db.delete(homeSections);
  });

  it('rejects an unknown section key', async () => {
    const { saveHomeSections } = await import('@/app/admin/actions/home-sections');
    const res = await saveHomeSections(null, form([{ key: 'khong-co-that', visible: true }]));
    expect(res?.error).toBeTruthy();
  });

  it('rejects a malformed payload', async () => {
    const { saveHomeSections } = await import('@/app/admin/actions/home-sections');
    const fd = new FormData();
    fd.set('sections', '{not json');
    expect((await saveHomeSections(null, fd))?.error).toBeTruthy();
  });

  it('blocks unauthenticated saves', async () => {
    authed = false;
    const { saveHomeSections } = await import('@/app/admin/actions/home-sections');
    await expect(saveHomeSections(null, form([{ key: 'hero', visible: false }]))).rejects.toThrow();
    authed = true;
  });
});

describe('media search', () => {
  it('treats % and _ as literal characters, not wildcards', async () => {
    const { db } = await import('@/db/client');
    const { media } = await import('@/db/schema');
    const { listMedia } = await import('@/lib/media');

    await db.insert(media).values([
      { url: '/uploads/a.webp', filename: 'giam-50%.webp', alt: '' },
      { url: '/uploads/b.webp', filename: 'giam-500k.webp', alt: '' },
      { url: '/uploads/c.webp', filename: 'ca_chua.webp', alt: '' },
      { url: '/uploads/d.webp', filename: 'caXchua.webp', alt: '' },
    ]);

    // Unescaped, '%50%%' would match giam-500k.webp too.
    const pct = await listMedia({ q: '50%' });
    expect(pct.rows.map((r) => r.filename)).toEqual(['giam-50%.webp']);

    // Unescaped, '_' matches any single character, so caXchua would match.
    const underscore = await listMedia({ q: 'ca_chua' });
    expect(underscore.rows.map((r) => r.filename)).toEqual(['ca_chua.webp']);

    // Ordinary searches still work.
    expect((await listMedia({ q: 'giam' })).total).toBe(2);

    await db.delete(media);
  });
});

describe('flash messages', () => {
  it('maps known codes to a real explanation', async () => {
    const { flashOf } = await import('@/lib/admin/flash');
    expect(flashOf('danh-muc-dang-dung')?.kind).toBe('error');
    expect(flashOf('danh-muc-dang-dung')?.text).toMatch(/không xóa được/i);
  });

  it('ignores anything not in the table, so a crafted URL cannot fake a message', async () => {
    const { flashOf } = await import('@/lib/admin/flash');
    expect(flashOf('<script>alert(1)</script>')).toBeNull();
    expect(flashOf('Tài khoản của bạn đã bị khóa')).toBeNull();
    expect(flashOf(undefined)).toBeNull();
    expect(flashOf(['a', 'b'])).toBeNull();
  });
});
