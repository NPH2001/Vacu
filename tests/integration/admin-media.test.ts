import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

let authed = true;
vi.mock('@/lib/session', () => ({
  requireAdmin: async () => {
    if (!authed) throw new Error('unauthorized');
    return { id: 'u1', email: 'a@vacu.com.vn', name: 'A', role: 'admin' };
  },
  getCurrentUser: async () => (authed ? { id: 'u1', role: 'admin' } : null),
}));

const deleted: string[] = [];
vi.mock('@/lib/uploads', async (orig) => ({
  ...(await orig<typeof import('@/lib/uploads')>()),
  deleteUpload: async (url: string) => { deleted.push(url); },
}));

vi.mock('next/cache', () => ({ revalidatePath: () => {} }));

let ctx: TestDb;
beforeAll(async () => { ctx = await bootPg(); }, 120_000);
afterAll(async () => { await stopPg(ctx); });
beforeEach(async () => {
  authed = true;
  deleted.length = 0;
  const { db } = await import('@/db/client');
  const { media, products, categories } = await import('@/db/schema');
  await db.delete(products); await db.delete(categories); await db.delete(media);
});

async function seedMedia(url: string) {
  const { db } = await import('@/db/client');
  const { media } = await import('@/db/schema');
  await db.insert(media).values({ url, filename: url.split('/').pop() ?? 'f.webp' });
}

describe('media actions', () => {
  it('blocks unauthenticated delete', async () => {
    authed = false;
    const { deleteMedia } = await import('@/app/admin/actions/media');
    await expect(deleteMedia('/uploads/x.webp')).rejects.toThrow();
  });

  it('refuses to delete a file that is in use, and lists the referrers', async () => {
    const url = '/uploads/in-use.webp';
    await seedMedia(url);
    const { db } = await import('@/db/client');
    const { categories, products } = await import('@/db/schema');
    await db.insert(categories).values({ id: 'c', name: 'C', icon: '🥬', description: '-' });
    await db.insert(products).values({
      id: 'p', name: 'Rau', categoryId: 'c', unit: 'kg', price: 1, image: url, description: '-',
    });

    const { deleteMedia } = await import('@/app/admin/actions/media');
    const res = await deleteMedia(url);
    expect(res.deleted).toBe(false);
    if (!res.deleted) expect(res.usage[0]).toMatchObject({ kind: 'Sản phẩm', label: 'Rau' });

    // media row still present, file not touched
    const { media } = await import('@/db/schema');
    expect(await db.select().from(media)).toHaveLength(1);
    expect(deleted).toHaveLength(0);
  });

  it('force-deletes an in-use file, removing the row and the file', async () => {
    const url = '/uploads/force.webp';
    await seedMedia(url);
    const { db } = await import('@/db/client');
    const { categories, products, media } = await import('@/db/schema');
    await db.insert(categories).values({ id: 'c', name: 'C', icon: '🥬', description: '-' });
    await db.insert(products).values({
      id: 'p', name: 'Rau', categoryId: 'c', unit: 'kg', price: 1, image: url, description: '-',
    });

    const { deleteMedia } = await import('@/app/admin/actions/media');
    const res = await deleteMedia(url, true);
    expect(res.deleted).toBe(true);
    expect(await db.select().from(media)).toHaveLength(0);
    expect(deleted).toEqual([url]);
  });

  it('deletes an unused file without force', async () => {
    const url = '/uploads/free.webp';
    await seedMedia(url);
    const { deleteMedia } = await import('@/app/admin/actions/media');
    const { db } = await import('@/db/client');
    const { media } = await import('@/db/schema');
    const res = await deleteMedia(url);
    expect(res.deleted).toBe(true);
    expect(await db.select().from(media)).toHaveLength(0);
    expect(deleted).toEqual([url]);
  });

  it('updateMediaAlt saves a (capped) description', async () => {
    const url = '/uploads/alt.webp';
    await seedMedia(url);
    const { updateMediaAlt } = await import('@/app/admin/actions/media');
    const { db } = await import('@/db/client');
    const { media } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const res = await updateMediaAlt(url, 'Ảnh rau cải');
    expect(res?.ok).toBeTruthy();
    const [row] = await db.select().from(media).where(eq(media.url, url));
    expect(row.alt).toBe('Ảnh rau cải');
  });
});
