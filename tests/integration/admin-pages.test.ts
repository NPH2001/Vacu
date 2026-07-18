import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';
import type { BlockEntry } from '@/lib/blocks';

let authed = true;
const ADMIN = { id: 'u1', email: 'admin@vacu.com.vn', name: 'Admin', role: 'admin' as const };

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

function form(meta: Record<string, string>, blocks: BlockEntry[]): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(meta)) fd.set(k, v);
  fd.set('blocks', JSON.stringify(blocks));
  return fd;
}

const hero = (title: string): BlockEntry => ({
  visible: true,
  data: { type: 'hero', badge: '', title, subtitle: '', image: '' },
});

describe('createPage', () => {
  it('creates a page with its blocks in order', async () => {
    const { createPage } = await import('@/app/admin/actions/pages');
    const { getAnyPage } = await import('@/lib/pages');

    await expect(createPage(null, form(
      { id: 'tuyen-dung', title: 'Tuyển dụng', status: 'published' },
      [
        hero('Tuyển dụng'),
        { visible: true, data: { type: 'richtext', html: '<p>Nội dung</p>' } },
        { visible: true, data: { type: 'cta', title: 'Ứng tuyển', subtitle: '', label: 'Gửi CV', href: '/contact' } },
      ],
    ))).rejects.toThrow();

    const page = await getAnyPage('tuyen-dung');
    expect(page).not.toBeNull();
    expect(page!.blocks.map((b) => b.data.type)).toEqual(['hero', 'richtext', 'cta']);
  });

  it('refuses a slug that a static route already answers', async () => {
    const { createPage } = await import('@/app/admin/actions/pages');
    // /products is a real route, so this page would save but never be
    // reachable — better to reject it than to create a page that never shows.
    const res = await createPage(null, form({ id: 'products', title: 'X', status: 'published' }, []));
    expect(res?.error).toMatch(/đã được hệ thống dùng/i);
  });

  it('rejects a duplicate slug in plain language', async () => {
    const { createPage } = await import('@/app/admin/actions/pages');
    await expect(createPage(null, form({ id: 'trung-lap', title: 'A', status: 'draft' }, []))).rejects.toThrow();
    const res = await createPage(null, form({ id: 'trung-lap', title: 'B', status: 'draft' }, []));
    expect(res?.error).toMatch(/đã có trang khác/i);
  });

  it('blocks unauthenticated writes', async () => {
    authed = false;
    const { createPage } = await import('@/app/admin/actions/pages');
    await expect(createPage(null, form({ id: 'khong-duoc', title: 'X', status: 'published' }, [])))
      .rejects.toThrow();
    authed = true;

    const { getAnyPage } = await import('@/lib/pages');
    expect(await getAnyPage('khong-duoc')).toBeNull();
  });

  it('sanitizes rich-text blocks before storing them', async () => {
    const { createPage } = await import('@/app/admin/actions/pages');
    const { getAnyPage } = await import('@/lib/pages');

    await expect(createPage(null, form({ id: 'xss-page', title: 'X', status: 'published' }, [
      { visible: true, data: { type: 'richtext', html: '<p onclick="evil()">Chào</p><script>alert(1)</script>' } },
    ]))).rejects.toThrow();

    const page = await getAnyPage('xss-page');
    const block = page!.blocks[0].data;
    expect(block.type).toBe('richtext');
    if (block.type !== 'richtext') throw new Error('unreachable');
    expect(block.html).not.toContain('<script');
    expect(block.html).not.toContain('onclick');
    expect(block.html).toContain('Chào');
  });

  it('rejects a malformed block payload rather than storing junk', async () => {
    const { createPage } = await import('@/app/admin/actions/pages');
    const fd = new FormData();
    fd.set('id', 'hong');
    fd.set('title', 'X');
    fd.set('blocks', '{not json');
    const res = await createPage(null, fd);
    expect(res?.error).toBeTruthy();

    const fd2 = new FormData();
    fd2.set('id', 'hong2');
    fd2.set('title', 'X');
    fd2.set('blocks', JSON.stringify([{ visible: true, data: { type: 'khong-co-that' } }]));
    const res2 = await createPage(null, fd2);
    expect(res2?.error).toBeTruthy();
  });
});

describe('publish + visibility rules', () => {
  it('a draft page is invisible to the public but readable by the admin', async () => {
    const { createPage } = await import('@/app/admin/actions/pages');
    const { getPublishedPage, getAnyPage } = await import('@/lib/pages');

    await expect(createPage(null, form({ id: 'con-nhap', title: 'Nháp', status: 'draft' }, [hero('Bí mật')])))
      .rejects.toThrow();

    expect(await getPublishedPage('con-nhap')).toBeNull();
    expect((await getAnyPage('con-nhap'))?.title).toBe('Nháp');
  });

  it('hidden blocks are stripped from the public page but kept for the admin', async () => {
    const { createPage } = await import('@/app/admin/actions/pages');
    const { getPublishedPage, getAnyPage } = await import('@/lib/pages');

    await expect(createPage(null, form({ id: 'co-khoi-an', title: 'T', status: 'published' }, [
      hero('Thấy được'),
      { visible: false, data: { type: 'richtext', html: '<p>Khối bị ẩn</p>' } },
    ]))).rejects.toThrow();

    // Hiding must not delete: the admin still sees it to turn back on.
    expect((await getPublishedPage('co-khoi-an'))!.blocks).toHaveLength(1);
    expect((await getAnyPage('co-khoi-an'))!.blocks).toHaveLength(2);
  });
});

describe('updatePage', () => {
  it('replaces blocks wholesale, honouring reorder and removal', async () => {
    const { createPage, updatePage } = await import('@/app/admin/actions/pages');
    const { getAnyPage } = await import('@/lib/pages');

    await expect(createPage(null, form({ id: 'sap-xep', title: 'T', status: 'published' }, [
      hero('Một'),
      { visible: true, data: { type: 'richtext', html: '<p>Hai</p>' } },
      { visible: true, data: { type: 'stats', title: 'Ba', items: [] } },
    ]))).rejects.toThrow();

    // Reordered, one dropped.
    await expect(updatePage('sap-xep', null, form({ id: 'sap-xep', title: 'T', status: 'published' }, [
      { visible: true, data: { type: 'richtext', html: '<p>Hai</p>' } },
      hero('Một'),
    ]))).rejects.toThrow();

    const page = await getAnyPage('sap-xep');
    expect(page!.blocks.map((b) => b.data.type)).toEqual(['richtext', 'hero']);
  });

  it('unpublishing hides a live page again', async () => {
    const { createPage, updatePage } = await import('@/app/admin/actions/pages');
    const { getPublishedPage } = await import('@/lib/pages');

    await expect(createPage(null, form({ id: 'go-xuong', title: 'T', status: 'published' }, [hero('x')])))
      .rejects.toThrow();
    expect(await getPublishedPage('go-xuong')).not.toBeNull();

    await expect(updatePage('go-xuong', null, form({ id: 'go-xuong', title: 'T', status: 'draft' }, [hero('x')])))
      .rejects.toThrow();
    expect(await getPublishedPage('go-xuong')).toBeNull();
  });
});

describe('deletePage', () => {
  it('deletes the page and cascades its blocks', async () => {
    const { createPage, deletePage } = await import('@/app/admin/actions/pages');
    const { getAnyPage } = await import('@/lib/pages');
    const { db } = await import('@/db/client');
    const { pageBlocks } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPage(null, form({ id: 'sap-xoa', title: 'T', status: 'published' }, [hero('x')])))
      .rejects.toThrow();

    await expect(deletePage('sap-xoa')).rejects.toThrow();
    expect(await getAnyPage('sap-xoa')).toBeNull();
    // ON DELETE CASCADE — orphan blocks would otherwise pile up invisibly.
    expect(await db.select().from(pageBlocks).where(eq(pageBlocks.pageId, 'sap-xoa'))).toHaveLength(0);
  });
});

describe('reading damaged rows', () => {
  it('skips a block whose stored data no longer matches its schema', async () => {
    const { db } = await import('@/db/client');
    const { pages, pageBlocks } = await import('@/db/schema');
    const { getPublishedPage } = await import('@/lib/pages');

    await db.insert(pages).values({ id: 'hong-data', title: 'T', status: 'published' });
    await db.insert(pageBlocks).values([
      { pageId: 'hong-data', type: 'hero', sortOrder: 0, visible: true,
        data: { badge: '', title: 'Tốt', subtitle: '', image: '' } },
      // jsonb guarantees nothing about shape; an unknown type must not take the
      // whole page down.
      { pageId: 'hong-data', type: 'khong-biet-la-gi', sortOrder: 10, visible: true, data: { x: 1 } },
    ]);

    const page = await getPublishedPage('hong-data');
    expect(page).not.toBeNull();
    expect(page!.blocks).toHaveLength(1);
    expect(page!.blocks[0].data.type).toBe('hero');
  });
});
