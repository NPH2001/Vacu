import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

// lookupOrder rate-limits (clientIp → headers()) and sets a cookie — both need a
// request scope vitest doesn't provide. A distinct IP per call keeps the
// per-process limiter from tripping across cases.
let ipCounter = 0;
const cookieStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  headers: async () => new Map<string, string>([['x-forwarded-for', `10.5.0.${ipCounter++}`]]),
  cookies: async () => ({
    get: (k: string) => (cookieStore.has(k) ? { value: cookieStore.get(k)! } : undefined),
    set: (k: string, v: string) => { cookieStore.set(k, v); },
    delete: (k: string) => { cookieStore.delete(k); },
  }),
}));

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:17').start();
  process.env.DATABASE_URL = container.getConnectionUri();
  const { migrate } = await import('drizzle-orm/node-postgres/migrator');
  const { db } = await import('@/db/client');
  const { orders } = await import('@/db/schema');
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.insert(orders).values({
    id: 'NTX-LOOKUP01', customerName: 'Chị Lan', phone: '0912 345 678',
    address: 'x', deliverySlot: 'Sáng', total: 50000, paymentMethod: 'cod',
  });
}, 120_000);

afterAll(async () => {
  const { pool } = await import('@/db/client');
  await pool.end();
  await container.stop();
});

beforeEach(() => { cookieStore.clear(); });

describe('lookupOrder', () => {
  it('matches on code + phone (any spacing) and adds the order to the cookie', async () => {
    const { lookupOrder } = await import('@/app/(public)/orders/actions');
    const fd = new FormData();
    fd.set('orderCode', 'ntx-lookup01');   // case-insensitive
    fd.set('phone', '0912345678');          // no spaces
    await expect(lookupOrder(null, fd)).rejects.toThrow(); // redirect on success
    const { MY_ORDERS_COOKIE, parseMyOrders } = await import('@/lib/orders-cookie');
    expect(parseMyOrders(cookieStore.get(MY_ORDERS_COOKIE))).toContain('NTX-LOOKUP01');
  });

  it('rejects a wrong phone with a generic message and sets no cookie', async () => {
    const { lookupOrder } = await import('@/app/(public)/orders/actions');
    const fd = new FormData();
    fd.set('orderCode', 'NTX-LOOKUP01');
    fd.set('phone', '0900000000');
    const res = await lookupOrder(null, fd);
    expect(res?.error).toBeTruthy();
    const { MY_ORDERS_COOKIE } = await import('@/lib/orders-cookie');
    expect(cookieStore.has(MY_ORDERS_COOKIE)).toBe(false);
  });

  it('rejects an unknown code with the SAME message (no enumeration oracle)', async () => {
    const { lookupOrder } = await import('@/app/(public)/orders/actions');
    const wrongPhone = new FormData();
    wrongPhone.set('orderCode', 'NTX-LOOKUP01'); wrongPhone.set('phone', '0900000000');
    const unknown = new FormData();
    unknown.set('orderCode', 'NTX-NOPE0000'); unknown.set('phone', '0912345678');
    const a = await lookupOrder(null, wrongPhone);
    const b = await lookupOrder(null, unknown);
    expect(a?.error).toBe(b?.error);
  });
});
