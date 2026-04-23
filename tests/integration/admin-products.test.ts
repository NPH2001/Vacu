import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

let authed = true;

vi.mock('@/lib/session', () => ({
  getCurrentUser: async () => authed ? { id: 'u1', email: 'admin@vacu.com.vn', name: 'A', role: 'admin' } : null,
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
  clearSessionCookie: async () => {},
  getSession: async () => null,
}));

const uploadCalls: Array<{ fn: string; args: unknown[] }> = [];
vi.mock('@/lib/uploads', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/uploads')>();
  return {
    ...orig,
    deleteUpload: async (url: string | null | undefined) => { uploadCalls.push({ fn: 'deleteUpload', args: [url] }); },
    deleteUploadIfReplaced: async (prev: string | null | undefined, next: string | null | undefined) => {
      uploadCalls.push({ fn: 'deleteUploadIfReplaced', args: [prev, next] });
    },
  };
});

let ctx: TestDb;

beforeAll(async () => {
  ctx = await bootPg();
  const { db } = await import('@/db/client');
  const { categories, farmers } = await import('@/db/schema');

  await db.insert(categories).values([
    { id: 'leafy', name: 'Rau ăn lá', icon: '🥬', description: 'Rau xanh' },
    { id: 'root', name: 'Củ quả', icon: '🥔', description: 'Củ' },
  ]);
  await db.insert(farmers).values([
    { id: 'farmer-a', name: 'Chị A', farm: 'F', location: 'ĐL', years: 5, specialty: 's',
      avatar: '/u/fa.webp', cover: '/u/fac.webp', story: 's' },
  ]);
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

beforeEach(() => {
  authed = true;
  uploadCalls.length = 0;
});

function pForm(v: Partial<Record<
  'id' | 'name' | 'categoryId' | 'unit' | 'price' | 'oldPrice' | 'image' |
  'farmerId' | 'description' | 'body' | 'tags' | 'featured' | 'inStock',
  string
>>) {
  const fd = new FormData();
  for (const [k, val] of Object.entries(v)) fd.set(k, val as string);
  return fd;
}

const valid = () => ({
  id: 'prod-1',
  name: 'Rau cải ngọt',
  categoryId: 'leafy',
  unit: 'kg',
  price: '25000',
  image: '/uploads/p1.webp',
  description: 'Rau tươi từ nông trại',
});

describe('createProduct', () => {
  it('blocks unauth', async () => {
    authed = false;
    const { createProduct } = await import('@/app/admin/actions/products');
    await expect(createProduct(null, pForm(valid()))).rejects.toThrow();
  });

  it('rejects invalid slug id', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const res = await createProduct(null, pForm({ ...valid(), id: 'BAD ID' }));
    expect(res?.error).toBeTruthy();
  });

  it('rejects non-positive price (0 or negative)', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const r1 = await createProduct(null, pForm({ ...valid(), id: 'p-zero', price: '0' }));
    expect(r1?.error).toBeTruthy();
    const r2 = await createProduct(null, pForm({ ...valid(), id: 'p-neg', price: '-100' }));
    expect(r2?.error).toBeTruthy();
  });

  it('rejects non-integer price (decimals)', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const res = await createProduct(null, pForm({ ...valid(), id: 'p-dec', price: '25.50' }));
    expect(res?.error).toBeTruthy();
  });

  it('creates; featured + inStock are false when checkbox fields absent (action uses === "on")', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createProduct(null, pForm(valid()))).rejects.toThrow();
    const [row] = await db.select().from(products).where(eq(products.id, 'prod-1'));
    expect(row.featured).toBe(false);
    // both toggles collapse to false when the form field is absent — this matches
    // the checkbox semantics used by the admin form.
    expect(row.inStock).toBe(false);
    expect(row.categoryId).toBe('leafy');
    expect(row.farmerId).toBeNull();
    expect(row.oldPrice).toBeNull();
    expect(row.tags).toEqual([]);
    expect(row.body).toBe('');
  });

  it('parses tags (comma, trim, drops empty) and honors toggles + optional fields', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createProduct(null, pForm({
      ...valid(), id: 'prod-full',
      oldPrice: '30000',
      farmerId: 'farmer-a',
      body: '# Long content\n\nParagraph',
      tags: '  hữu cơ , , VietGAP,   tươi,',
      featured: 'on',
      inStock: 'on',
    }))).rejects.toThrow();

    const [row] = await db.select().from(products).where(eq(products.id, 'prod-full'));
    expect(row.oldPrice).toBe(30000);
    expect(row.farmerId).toBe('farmer-a');
    expect(row.tags).toEqual(['hữu cơ', 'VietGAP', 'tươi']);
    expect(row.featured).toBe(true);
    expect(row.inStock).toBe(true);
    expect(row.body).toContain('# Long content');
  });

  it('rejects product referencing non-existent category (FK violation)', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const res = await createProduct(null, pForm({
      ...valid(), id: 'prod-bad-cat', categoryId: 'nonexistent',
    }));
    expect(res?.error).toBeTruthy(); // FK error surfaces in error
  });

  it('rejects duplicate product id (unique PK)', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    // prod-1 already exists from earlier test
    const res = await createProduct(null, pForm({ ...valid(), id: 'prod-1' }));
    expect(res?.error).toBeTruthy();
  });

  it('rejects oversize body (>20000)', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const res = await createProduct(null, pForm({
      ...valid(), id: 'p-bigbody', body: 'x'.repeat(20001),
    }));
    expect(res?.error).toBeTruthy();
  });
});

describe('updateProduct', () => {
  it('updates product, triggers deleteUploadIfReplaced for image', async () => {
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    await db.insert(products).values({
      id: 'prod-upd', name: 'N', categoryId: 'leafy', unit: 'kg', price: 10000,
      image: '/uploads/old.webp', description: 'd',
    });

    uploadCalls.length = 0;
    const { updateProduct } = await import('@/app/admin/actions/products');
    await expect(updateProduct('prod-upd', null, pForm({
      id: 'prod-upd', name: 'New name', categoryId: 'root', unit: 'bó',
      price: '15000', image: '/uploads/new.webp', description: 'dd',
    }))).rejects.toThrow();

    const [row] = await db.select().from(products).where(eq(products.id, 'prod-upd'));
    expect(row.name).toBe('New name');
    expect(row.categoryId).toBe('root');
    expect(row.image).toBe('/uploads/new.webp');
    expect(uploadCalls[0]).toEqual({ fn: 'deleteUploadIfReplaced', args: ['/uploads/old.webp', '/uploads/new.webp'] });
  });

  it('returns error when updating non-existent product (no op but no image call either)', async () => {
    const { updateProduct } = await import('@/app/admin/actions/products');
    uploadCalls.length = 0;
    await expect(updateProduct('ghost-prod', null, pForm(valid()))).rejects.toThrow();
    // existing lookup returns undefined; uploads helper not called
    expect(uploadCalls).toHaveLength(0);
  });

  it('blocks unauth', async () => {
    authed = false;
    const { updateProduct } = await import('@/app/admin/actions/products');
    await expect(updateProduct('prod-upd', null, pForm(valid()))).rejects.toThrow();
  });
});

describe('deleteProduct / bulkDeleteProducts', () => {
  it('delete triggers deleteUpload on stored image', async () => {
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await db.insert(products).values({
      id: 'prod-del', name: 'N', categoryId: 'leafy', unit: 'kg', price: 10000,
      image: '/uploads/to-del.webp', description: 'd',
    });

    uploadCalls.length = 0;
    const { deleteProduct } = await import('@/app/admin/actions/products');
    await expect(deleteProduct('prod-del')).rejects.toThrow();
    expect(uploadCalls[0]).toEqual({ fn: 'deleteUpload', args: ['/uploads/to-del.webp'] });

    const rows = await db.select().from(products).where(eq(products.id, 'prod-del'));
    expect(rows).toHaveLength(0);
  });

  it('delete of non-existent id → no upload call, still redirects', async () => {
    uploadCalls.length = 0;
    const { deleteProduct } = await import('@/app/admin/actions/products');
    await expect(deleteProduct('prod-ghost')).rejects.toThrow();
    expect(uploadCalls).toHaveLength(0);
  });

  it('bulkDelete removes and calls deleteUpload for each image', async () => {
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');
    await db.insert(products).values([
      { id: 'pb1', name: 'N', categoryId: 'leafy', unit: 'kg', price: 1000, image: '/u/i1.webp', description: 'd' },
      { id: 'pb2', name: 'N', categoryId: 'root',  unit: 'kg', price: 2000, image: '/u/i2.webp', description: 'd' },
    ]);

    uploadCalls.length = 0;
    const { bulkDeleteProducts } = await import('@/app/admin/actions/products');
    const fd = new FormData();
    fd.append('ids', 'pb1');
    fd.append('ids', '');
    fd.append('ids', 'pb2');
    await expect(bulkDeleteProducts(fd)).rejects.toThrow();

    const urls = uploadCalls.filter((c) => c.fn === 'deleteUpload').flatMap((c) => c.args);
    expect(new Set(urls)).toEqual(new Set(['/u/i1.webp', '/u/i2.webp']));

    const rem = await db.select().from(products).where(inArray(products.id, ['pb1', 'pb2']));
    expect(rem).toHaveLength(0);
  });

  it('deleting farmer cascades farmerId to null (set null FK)', async () => {
    const { db } = await import('@/db/client');
    const { products, farmers } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await db.insert(farmers).values({
      id: 'farmer-b', name: 'B', farm: 'F', location: 'L', years: 1, specialty: 's',
      avatar: '/u/b.webp', cover: '/u/bc.webp', story: 's',
    });
    await db.insert(products).values({
      id: 'prod-fb', name: 'N', categoryId: 'leafy', unit: 'kg', price: 1000,
      image: '/u/p.webp', description: 'd', farmerId: 'farmer-b',
    });

    await db.delete(farmers).where(eq(farmers.id, 'farmer-b'));

    const [row] = await db.select().from(products).where(eq(products.id, 'prod-fb'));
    expect(row.farmerId).toBeNull(); // onDelete: 'set null'
  });
});
