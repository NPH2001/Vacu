import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17').start();
  process.env.DATABASE_URL = container.getConnectionUri();
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const { db } = await import('@/db/client');
  await migrate(db, { migrationsFolder: './drizzle' });
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
    fd.set('deliverySlot', '16:00-18:00');
    fd.set('cart', JSON.stringify([{ id: 'p1', name: 'P1', price: 10_000, qty: 2, unit: 'x', image: '/x.jpg' }]));

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
});
