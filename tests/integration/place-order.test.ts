import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

// placeOrder now rate-limits by client IP (via clientIp → headers()) and, on
// success, appends the order id to a cookie. Both need a request scope that
// vitest doesn't provide, so stub next/headers. A distinct IP per call keeps
// the rate limiter (per-process, shared across tests) from tripping mid-suite.
let ipCounter = 0;
vi.mock('next/headers', () => ({
  headers: async () => new Map<string, string>([['x-forwarded-for', `10.0.0.${ipCounter++}`]]),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

let container: StartedPostgreSqlContainer;
let validSlot: string; // a seeded active delivery slot label (checkout validates against these)

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17').start();
  process.env.DATABASE_URL = container.getConnectionUri();
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const { db } = await import('@/db/client');
  const { deliverySlots } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  await migrate(db, { migrationsFolder: './drizzle' });
  const active = await db.select().from(deliverySlots).where(eq(deliverySlots.active, true));
  validSlot = active[0]?.label ?? '16:00-18:00';
}, 120_000);

afterAll(async () => {
  const { pool } = await import('@/db/client');
  await pool.end();
  await container.stop();
});

describe('placeOrder', () => {
  it('creates an order and items', async () => {
    const { db } = await import('@/db/client');
    const { categories, products, orders, orderItems } = await import('@/db/schema');
    await db.insert(categories).values({ id: 'c1', name: 'c1', icon: '🥬', description: '-' });
    await db.insert(products).values({
      id: 'p1', name: 'P1', categoryId: 'c1', unit: 'x', price: 10_000,
      image: '/x.jpg', description: '-',
    });

    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const fd = new FormData();
    fd.set('customerName', 'Ana');
    fd.set('phone', '0900000000');
    fd.set('address', '12 Đường Tre');
    fd.set('deliverySlot', validSlot);
    fd.set('cart', JSON.stringify([{ id: 'p1', qty: 2 }]));

    const res = await placeOrder(fd);
    if (!res.ok) throw new Error(`placeOrder failed: ${res.error}`);
    expect(res.orderId).toMatch(/^NTX-/);

    const { eq } = await import('drizzle-orm');
    const savedItems = await db.select().from(orderItems).where(eq(orderItems.orderId, res.orderId!));
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].qty).toBe(2);

    const savedOrder = await db.select().from(orders).where(eq(orders.id, res.orderId!)).limit(1);
    expect(savedOrder[0].total).toBe(20_000);
    expect(savedOrder[0].status).toBe('pending');
  });

  async function seedProduct(id: string, price: number, inStock = true) {
    const { db } = await import('@/db/client');
    const { products } = await import('@/db/schema');
    await db.insert(products).values({
      id, name: id.toUpperCase(), categoryId: 'c1', unit: 'x', price, image: '/x.jpg', description: '-', inStock,
    });
  }
  function baseForm() {
    const fd = new FormData();
    fd.set('customerName', 'Ana');
    fd.set('phone', '0900000000');
    fd.set('address', '12 Đường Tre');
    fd.set('deliverySlot', validSlot);
    return fd;
  }

  it('ignores the client-sent price and charges the database price', async () => {
    await seedProduct('p-tamper', 50_000);
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const { db } = await import('@/db/client');
    const { orders, orderItems } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = baseForm();
    // Attacker forges price: 1 — must be ignored.
    fd.set('cart', JSON.stringify([{ id: 'p-tamper', qty: 2, price: 1, name: 'HACK' }]));
    const res = await placeOrder(fd);
    if (!res.ok) throw new Error(res.error);

    const [o] = await db.select().from(orders).where(eq(orders.id, res.orderId)).limit(1);
    expect(o.total).toBe(100_000); // 50_000 × 2, not 2
    const [item] = await db.select().from(orderItems).where(eq(orderItems.orderId, res.orderId));
    expect(item.price).toBe(50_000);
    expect(item.name).toBe('P-TAMPER'); // DB name, not the forged "HACK"
  });

  it('rejects an out-of-stock product', async () => {
    await seedProduct('p-oos', 10_000, false);
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const fd = baseForm();
    fd.set('cart', JSON.stringify([{ id: 'p-oos', qty: 1 }]));
    const res = await placeOrder(fd);
    expect(res.ok).toBe(false);
  });

  it('rejects a product id that does not exist', async () => {
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const fd = baseForm();
    fd.set('cart', JSON.stringify([{ id: 'ghost-product', qty: 1 }]));
    const res = await placeOrder(fd);
    expect(res.ok).toBe(false);
  });

  it('is idempotent: the same key returns the same order, no duplicate', async () => {
    await seedProduct('p-idem', 12_000);
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const mk = () => {
      const fd = baseForm();
      fd.set('cart', JSON.stringify([{ id: 'p-idem', qty: 1 }]));
      fd.set('idempotencyKey', 'key-abc-123');
      return fd;
    };
    const r1 = await placeOrder(mk());
    const r2 = await placeOrder(mk());
    if (!r1.ok || !r2.ok) throw new Error('expected ok');
    expect(r2.orderId).toBe(r1.orderId);
    const rows = await db.select().from(orders).where(eq(orders.idempotencyKey, 'key-abc-123'));
    expect(rows).toHaveLength(1);
  });

  it('coerces bank→cod when bank transfer is not enabled', async () => {
    await seedProduct('p-pay', 20_000);
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = baseForm();
    fd.set('paymentMethod', 'bank');
    fd.set('cart', JSON.stringify([{ id: 'p-pay', qty: 1 }]));
    const res = await placeOrder(fd);
    if (!res.ok) throw new Error(res.error);
    const [o] = await db.select().from(orders).where(eq(orders.id, res.orderId)).limit(1);
    expect(o.paymentMethod).toBe('cod'); // no siteInfo / bankEnabled → cod
  });

  it('rejects a delivery slot that is not among the active ones', async () => {
    await seedProduct('p-slot', 15_000);
    const { db } = await import('@/db/client');
    const { deliverySlots } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [slot] = await db.insert(deliverySlots).values({ label: 'Sáng sớm', active: true }).returning();

    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const bad = baseForm();
    bad.set('deliverySlot', 'Giờ bịa đặt');
    bad.set('cart', JSON.stringify([{ id: 'p-slot', qty: 1 }]));
    expect((await placeOrder(bad)).ok).toBe(false);

    const good = baseForm();
    good.set('deliverySlot', 'Sáng sớm');
    good.set('cart', JSON.stringify([{ id: 'p-slot', qty: 1 }]));
    expect((await placeOrder(good)).ok).toBe(true);

    await db.delete(deliverySlots).where(eq(deliverySlots.id, slot.id)); // don't affect other tests
  });
});
