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

  it('shows a friendly Vietnamese message when the image is missing', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    // A real admin who forgets the cover image used to see the raw Zod string
    // "Too small: expected string to have >=1 characters".
    const res = await createProduct(null, pForm({ ...valid(), id: 'p-no-img', image: '' }));
    expect(res?.error).toBe('Vui lòng chọn ảnh đại diện cho sản phẩm');
  });

  it('shows a friendly message when the category is missing', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const res = await createProduct(null, pForm({ ...valid(), id: 'p-no-cat', categoryId: '' }));
    expect(res?.error).toBe('Vui lòng chọn danh mục');
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

  // The cap went from 20k to 200k when the body moved from Markdown to
  // rich-text HTML: the same article carries far more bytes once it is wrapped
  // in tags.
  it('rejects oversize body (>200000)', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const res = await createProduct(null, pForm({
      ...valid(), id: 'p-bigbody', body: 'x'.repeat(200001),
    }));
    expect(res?.error).toBeTruthy();
  });

  it('sanitizes hostile HTML in the product body before storing it', async () => {
    const { createProduct } = await import('@/app/admin/actions/products');
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createProduct(null, pForm({
      ...valid(),
      id: 'p-xss',
      body: '<p onclick="evil()">Cà chua</p><script>alert(1)</script>',
    }))).rejects.toThrow();

    const [row] = await db.select().from(products).where(eq(products.id, 'p-xss'));
    expect(row.body).not.toContain('<script');
    expect(row.body).not.toContain('onclick');
    expect(row.body).toContain('Cà chua');
  });
});

describe('product gallery', () => {
  it('stores gallery images in the submitted order and replaces them on update', async () => {
    const { createProduct, updateProduct } = await import('@/app/admin/actions/products');
    const { getProductGallery } = await import('@/lib/data');

    const fd = pForm({ ...valid(), id: 'p-gallery' });
    fd.append('gallery', '/uploads/a.webp');
    fd.append('gallery', '/uploads/b.webp');
    await expect(createProduct(null, fd)).rejects.toThrow();
    expect(await getProductGallery('p-gallery')).toEqual(['/uploads/a.webp', '/uploads/b.webp']);

    // Reordered + one swapped: the form submits the whole list, so the stored
    // set is replaced rather than appended to.
    const fd2 = pForm({ ...valid(), id: 'p-gallery' });
    fd2.append('gallery', '/uploads/b.webp');
    fd2.append('gallery', '/uploads/c.webp');
    await expect(updateProduct('p-gallery', null, fd2)).rejects.toThrow();
    expect(await getProductGallery('p-gallery')).toEqual(['/uploads/b.webp', '/uploads/c.webp']);
  });

  it('clearing the gallery removes every row', async () => {
    const { createProduct, updateProduct } = await import('@/app/admin/actions/products');
    const { getProductGallery } = await import('@/lib/data');

    const fd = pForm({ ...valid(), id: 'p-gallery-clear' });
    fd.append('gallery', '/uploads/x.webp');
    await expect(createProduct(null, fd)).rejects.toThrow();
    expect(await getProductGallery('p-gallery-clear')).toHaveLength(1);

    await expect(updateProduct('p-gallery-clear', null, pForm({ ...valid(), id: 'p-gallery-clear' })))
      .rejects.toThrow();
    expect(await getProductGallery('p-gallery-clear')).toEqual([]);
  });

  it('deleting a product takes its gallery rows with it', async () => {
    const { createProduct, deleteProduct } = await import('@/app/admin/actions/products');
    const { getProductGallery } = await import('@/lib/data');

    const fd = pForm({ ...valid(), id: 'p-gallery-del' });
    fd.append('gallery', '/uploads/g1.webp');
    await expect(createProduct(null, fd)).rejects.toThrow();

    // ON DELETE CASCADE — otherwise the FK would block the delete outright.
    await expect(deleteProduct('p-gallery-del')).rejects.toThrow();
    expect(await getProductGallery('p-gallery-del')).toEqual([]);
  });
});

describe('updateProduct', () => {
  it('updates product and leaves the replaced image on disk', async () => {
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
    // Uploads are shared via the media library, so swapping one product's image
    // must not delete a file other content may still reference.
    expect(uploadCalls).toHaveLength(0);
  });

  it('keeps an image alive that another product still uses', async () => {
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Both products point at the same library image.
    await db.insert(products).values([
      { id: 'shared-a', name: 'A', categoryId: 'leafy', unit: 'kg', price: 1000,
        image: '/uploads/shared.webp', description: 'd' },
      { id: 'shared-b', name: 'B', categoryId: 'leafy', unit: 'kg', price: 1000,
        image: '/uploads/shared.webp', description: 'd' },
    ]);

    uploadCalls.length = 0;
    const { updateProduct, deleteProduct } = await import('@/app/admin/actions/products');

    // A moves to a different image, then B is deleted entirely.
    await expect(updateProduct('shared-a', null, pForm({
      id: 'shared-a', name: 'A', categoryId: 'leafy', unit: 'kg',
      price: '1000', image: '/uploads/other.webp', description: 'd',
    }))).rejects.toThrow();
    await expect(deleteProduct('shared-b')).rejects.toThrow();

    // Neither path may touch the file — /uploads/shared.webp could still back a
    // post body or page block that these actions cannot see.
    expect(uploadCalls).toHaveLength(0);
    const [a] = await db.select().from(products).where(eq(products.id, 'shared-a'));
    expect(a.image).toBe('/uploads/other.webp');
  });

  it('returns error when updating non-existent product', async () => {
    const { updateProduct } = await import('@/app/admin/actions/products');
    uploadCalls.length = 0;
    await expect(updateProduct('ghost-prod', null, pForm(valid()))).rejects.toThrow();
    expect(uploadCalls).toHaveLength(0);
  });

  it('blocks unauth', async () => {
    authed = false;
    const { updateProduct } = await import('@/app/admin/actions/products');
    await expect(updateProduct('prod-upd', null, pForm(valid()))).rejects.toThrow();
  });
});

describe('deleteProduct / bulkDeleteProducts', () => {
  it('delete removes the row without deleting the image file', async () => {
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
    expect(uploadCalls).toHaveLength(0);

    const rows = await db.select().from(products).where(eq(products.id, 'prod-del'));
    expect(rows).toHaveLength(0);
  });

  it('delete of non-existent id → no upload call, still redirects', async () => {
    uploadCalls.length = 0;
    const { deleteProduct } = await import('@/app/admin/actions/products');
    await expect(deleteProduct('prod-ghost')).rejects.toThrow();
    expect(uploadCalls).toHaveLength(0);
  });

  it('bulkDelete removes all rows without deleting image files', async () => {
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

    expect(uploadCalls).toHaveLength(0);

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
