import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

let ctx: TestDb;

beforeAll(async () => {
  ctx = await bootPg();
  const { db } = await import('@/db/client');
  const {
    siteInfo, categories, farmers, products, testimonials, faqItems,
    valueProps, deliverySlots, paymentMethods, contactTopics, orderStatuses,
  } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  // fresh site_info (migration may have none)
  if ((await db.select().from(siteInfo)).length === 0) {
    await db.insert(siteInfo).values({
      id: 1, name: 'Vacu', shortName: 'Vacu', tagline: 't', description: 'd',
      address: 'a', phone: 'p', email: 'admin@vacu.com.vn', hours: 'h',
      statFarmers: '1', statProducts: '1', statCustomers: '1', statYears: '1',
    });
  }

  // categories (sortOrder guides getAllCategories ordering)
  await db.insert(categories).values([
    { id: 'c-z', name: 'Z last-name', icon: '🌱', description: 'd', sortOrder: 10 },
    { id: 'c-a', name: 'A first-name', icon: '🌱', description: 'd', sortOrder: 10 }, // same sortOrder, name breaks tie
    { id: 'c-early', name: 'M', icon: '🌱', description: 'd', sortOrder: 5 }, // lower sortOrder wins
  ]);

  // farmers — ordered by name asc
  await db.insert(farmers).values([
    { id: 'f-b', name: 'Bình', farm: 'F', location: 'L', years: 5, specialty: 's',
      avatar: '/u/a', cover: '/u/c', story: 's' },
    { id: 'f-a', name: 'An',   farm: 'F', location: 'L', years: 5, specialty: 's',
      avatar: '/u/a', cover: '/u/c', story: 's' },
  ]);

  // products — span two categories, featured toggle, farmerId set
  await db.insert(products).values([
    { id: 'p-beta',  name: 'Beta',  categoryId: 'c-early', unit: 'kg', price: 1000,
      image: '/u/p', description: 'd', featured: true,  inStock: true,  farmerId: 'f-a' },
    { id: 'p-alpha', name: 'Alpha', categoryId: 'c-early', unit: 'kg', price: 1000,
      image: '/u/p', description: 'd', featured: true,  inStock: true,  farmerId: 'f-a' },
    { id: 'p-gamma', name: 'Gamma', categoryId: 'c-z',    unit: 'kg', price: 1000,
      image: '/u/p', description: 'd', featured: false, inStock: false },
    // 10 more featured for limit tests
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `p-feat-${i}`, name: `Feat ${i}`, categoryId: 'c-early', unit: 'kg', price: 1000,
      image: '/u/p', description: 'd', featured: true, inStock: true,
    })),
  ]);

  await db.insert(testimonials).values([
    { name: 'T-B', role: 'r', avatar: '/u/t', content: 'c', sortOrder: 2 },
    { name: 'T-A', role: 'r', avatar: '/u/t', content: 'c', sortOrder: 1 },
  ]);
  await db.insert(faqItems).values([
    { question: 'Q-B', answer: 'a', sortOrder: 20 },
    { question: 'Q-A', answer: 'a', sortOrder: 10 },
  ]);

  // value props (value_props is empty in test? actually seeded by migration 0002 — append more)
  await db.insert(valueProps).values([
    { icon: 'X', title: 'later', description: 'd', sortOrder: 999 },
  ]);

  // delivery_slots: migration 0002 seeds 4 active; insert an inactive one
  await db.insert(deliverySlots).values({ label: 'Cực khuya (inactive)', active: false, sortOrder: 100 });

  // payment_methods: migration 0002 seeds 4 active; insert an inactive one
  await db.insert(paymentMethods).values({ id: 'zalopay-inactive', label: 'Inactive', active: false, sortOrder: 100 });

  // contact_topics: migration 0002 seeds 5
  await db.insert(contactTopics).values({ label: 'Bổ sung', sortOrder: 1 });

  // order_statuses: migration 0003 seeds 5 — nothing to add for order
  void eq; // unused
  void orderStatuses;
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

// ---------------- products ----------------
describe('getAllProducts / getProduct / getProductsByCategory / getFeaturedProducts', () => {
  it('getAllProducts orders ASC by name', async () => {
    const { getAllProducts } = await import('@/lib/data');
    const rows = await getAllProducts();
    const names = rows.filter((r) => r.id.startsWith('p-')).map((r) => r.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('getProduct returns row by id', async () => {
    const { getProduct } = await import('@/lib/data');
    const row = await getProduct('p-alpha');
    expect(row?.name).toBe('Alpha');
  });

  it('getProduct returns null when missing', async () => {
    const { getProduct } = await import('@/lib/data');
    expect(await getProduct('does-not-exist')).toBeNull();
  });

  it('getProductsByCategory returns only that category', async () => {
    const { getProductsByCategory } = await import('@/lib/data');
    const rows = await getProductsByCategory('c-z');
    expect(rows.map((r) => r.id)).toEqual(['p-gamma']);
  });

  it('getFeaturedProducts defaults limit to 8', async () => {
    const { getFeaturedProducts } = await import('@/lib/data');
    const rows = await getFeaturedProducts();
    expect(rows).toHaveLength(8);
    expect(rows.every((r) => r.featured)).toBe(true);
  });

  it('getFeaturedProducts respects explicit limit', async () => {
    const { getFeaturedProducts } = await import('@/lib/data');
    const rows = await getFeaturedProducts(3);
    expect(rows).toHaveLength(3);
  });
});

// ---------------- categories ----------------
describe('getAllCategories / getCategory', () => {
  it('orders by sortOrder asc, then name asc (tiebreak)', async () => {
    const { getAllCategories } = await import('@/lib/data');
    const rows = await getAllCategories();
    const mine = rows.filter((c) => c.id.startsWith('c-'));
    expect(mine.map((c) => c.id)).toEqual(['c-early', 'c-a', 'c-z']); // 5, 10+A, 10+Z
  });

  it('getCategory returns row or null', async () => {
    const { getCategory } = await import('@/lib/data');
    expect((await getCategory('c-a'))?.name).toBe('A first-name');
    expect(await getCategory('nope')).toBeNull();
  });
});

// ---------------- farmers ----------------
describe('getAllFarmers / getFarmer / getProductsByFarmer', () => {
  it('getAllFarmers orders by name asc', async () => {
    const { getAllFarmers } = await import('@/lib/data');
    const rows = await getAllFarmers();
    const mine = rows.filter((r) => r.id.startsWith('f-'));
    expect(mine.map((r) => r.id)).toEqual(['f-a', 'f-b']); // An, Bình
  });

  it('getFarmer returns row', async () => {
    const { getFarmer } = await import('@/lib/data');
    expect((await getFarmer('f-a'))?.name).toBe('An');
  });

  it('getFarmer(null) → null without query', async () => {
    const { getFarmer } = await import('@/lib/data');
    expect(await getFarmer(null)).toBeNull();
  });

  it('getFarmer missing → null', async () => {
    const { getFarmer } = await import('@/lib/data');
    expect(await getFarmer('ghost')).toBeNull();
  });

  it('getProductsByFarmer returns only that farmer\'s products sorted by name', async () => {
    const { getProductsByFarmer } = await import('@/lib/data');
    const rows = await getProductsByFarmer('f-a');
    expect(rows.map((r) => r.name)).toEqual(['Alpha', 'Beta']);
  });

  it('getProductsByFarmer with no matches → empty', async () => {
    const { getProductsByFarmer } = await import('@/lib/data');
    expect(await getProductsByFarmer('ghost-farmer')).toEqual([]);
  });
});

// ---------------- testimonials & faq ----------------
describe('getAllTestimonials / getAllFaqItems', () => {
  it('testimonials ordered by sortOrder asc, then id asc', async () => {
    const { getAllTestimonials } = await import('@/lib/data');
    const rows = await getAllTestimonials();
    const mine = rows.filter((r) => r.name.startsWith('T-'));
    expect(mine.map((r) => r.name)).toEqual(['T-A', 'T-B']); // sortOrder 1, 2
  });

  it('faq ordered by sortOrder asc, then id asc', async () => {
    const { getAllFaqItems } = await import('@/lib/data');
    const rows = await getAllFaqItems();
    const mine = rows.filter((r) => r.question.startsWith('Q-'));
    expect(mine.map((r) => r.question)).toEqual(['Q-A', 'Q-B']);
  });
});

// ---------------- site-info ----------------
describe('getSiteInfo', () => {
  it('returns row when present', async () => {
    const { getSiteInfo } = await import('@/lib/data');
    const row = await getSiteInfo();
    expect(row.name).toBe('Vacu');
  });

  it('throws when site_info row is missing', async () => {
    const { db } = await import('@/db/client');
    const { siteInfo } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    // remember existing row to restore after
    const [existing] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1));
    await db.delete(siteInfo).where(eq(siteInfo.id, 1));

    const { getSiteInfo } = await import('@/lib/data');
    await expect(getSiteInfo()).rejects.toThrow(/site_info row missing/);

    // restore
    await db.insert(siteInfo).values(existing);
  });
});

// ---------------- value_props / delivery_slots / payment_methods / contact_topics / order_statuses ----------------
describe('getAllValueProps', () => {
  it('orders by sortOrder asc, then id asc', async () => {
    const { getAllValueProps } = await import('@/lib/data');
    const rows = await getAllValueProps();
    // sortOrder should be non-decreasing
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].sortOrder).toBeGreaterThanOrEqual(rows[i - 1].sortOrder);
    }
  });
});

describe('getActiveDeliverySlots', () => {
  it('only active=true rows; inactive seed excluded', async () => {
    const { getActiveDeliverySlots } = await import('@/lib/data');
    const rows = await getActiveDeliverySlots();
    expect(rows.every((r) => r.active)).toBe(true);
    expect(rows.find((r) => r.label.includes('inactive'))).toBeUndefined();
  });
});

describe('getActivePaymentMethods', () => {
  it('only active=true rows', async () => {
    const { getActivePaymentMethods } = await import('@/lib/data');
    const rows = await getActivePaymentMethods();
    expect(rows.every((r) => r.active)).toBe(true);
    expect(rows.find((r) => r.id === 'zalopay-inactive')).toBeUndefined();
  });
});

describe('getAllContactTopics', () => {
  it('returns at least the migration seeds + ours', async () => {
    const { getAllContactTopics } = await import('@/lib/data');
    const rows = await getAllContactTopics();
    expect(rows.length).toBeGreaterThanOrEqual(6);
    // sortOrder non-decreasing
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].sortOrder).toBeGreaterThanOrEqual(rows[i - 1].sortOrder);
    }
  });
});

describe('getAllOrderStatuses / getOrderStatusMap', () => {
  it('returns all 5 migration-seeded statuses', async () => {
    const { getAllOrderStatuses } = await import('@/lib/data');
    const rows = await getAllOrderStatuses();
    const keys = rows.map((r) => r.key).sort();
    expect(keys).toEqual(['cancelled', 'delivered', 'delivering', 'pending', 'preparing']);
  });

  it('getOrderStatusMap keys by status key', async () => {
    const { getOrderStatusMap } = await import('@/lib/data');
    const map = await getOrderStatusMap();
    expect(map.pending.label).toBeTruthy();
    expect(map.delivered.label).toBeTruthy();
    expect(Object.keys(map).length).toBe(5);
  });
});

// ---------------- page-builder block sources ----------------
describe('getProductsForBlock', () => {
  const base = { source: 'featured' as const, categoryId: '', productIds: [] as string[], limit: 4 };

  it('featured: returns only featured, capped at limit', async () => {
    const { getProductsForBlock } = await import('@/lib/data');
    const rows = await getProductsForBlock({ ...base, source: 'featured', limit: 4 });
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.featured)).toBe(true);
  });

  it('category: returns only that category', async () => {
    const { getProductsForBlock } = await import('@/lib/data');
    const rows = await getProductsForBlock({ ...base, source: 'category', categoryId: 'c-z', limit: 10 });
    expect(rows.map((r) => r.id)).toEqual(['p-gamma']);
  });

  it('category with empty categoryId → empty', async () => {
    const { getProductsForBlock } = await import('@/lib/data');
    expect(await getProductsForBlock({ ...base, source: 'category', categoryId: '' })).toEqual([]);
  });

  it('manual: returns picked ids in the given order, ignoring limit', async () => {
    const { getProductsForBlock } = await import('@/lib/data');
    const rows = await getProductsForBlock({
      ...base, source: 'manual', productIds: ['p-gamma', 'p-alpha', 'p-beta'], limit: 1,
    });
    expect(rows.map((r) => r.id)).toEqual(['p-gamma', 'p-alpha', 'p-beta']);
  });

  it('manual with no ids → empty', async () => {
    const { getProductsForBlock } = await import('@/lib/data');
    expect(await getProductsForBlock({ ...base, source: 'manual', productIds: [] })).toEqual([]);
  });

  it('sale: returns only products whose oldPrice exceeds price', async () => {
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    await db.insert(products).values({
      id: 'p-sale', name: 'Sale item', categoryId: 'c-early', unit: 'kg',
      price: 800, oldPrice: 1000, image: '/u/p', description: 'd',
    });
    const { getProductsForBlock } = await import('@/lib/data');
    const rows = await getProductsForBlock({ ...base, source: 'sale', limit: 10 });
    expect(rows.map((r) => r.id)).toContain('p-sale');
    expect(rows.every((r) => r.oldPrice != null && r.oldPrice > r.price)).toBe(true);
    await db.delete(products).where(eq(products.id, 'p-sale'));
  });
});

describe('getCategoriesForBlock', () => {
  it('all: root categories ordered by sortOrder then name', async () => {
    const { getCategoriesForBlock } = await import('@/lib/data');
    const rows = await getCategoriesForBlock({ source: 'all', categoryIds: [], limit: 0 });
    const mine = rows.filter((c) => c.id.startsWith('c-'));
    expect(mine.map((c) => c.id)).toEqual(['c-early', 'c-a', 'c-z']);
  });

  it('all with limit caps the count', async () => {
    const { getCategoriesForBlock } = await import('@/lib/data');
    const rows = await getCategoriesForBlock({ source: 'all', categoryIds: [], limit: 2 });
    expect(rows).toHaveLength(2);
  });

  it('manual: returns picked ids in the given order', async () => {
    const { getCategoriesForBlock } = await import('@/lib/data');
    const rows = await getCategoriesForBlock({ source: 'manual', categoryIds: ['c-z', 'c-early'], limit: 0 });
    expect(rows.map((c) => c.id)).toEqual(['c-z', 'c-early']);
  });

  it('manual with no ids → empty', async () => {
    const { getCategoriesForBlock } = await import('@/lib/data');
    expect(await getCategoriesForBlock({ source: 'manual', categoryIds: [], limit: 0 })).toEqual([]);
  });
});
