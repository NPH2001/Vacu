import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

// next/cache throws "Invariant: static generation store missing" outside
// a request context; actions that don't end in redirect() would surface
// that noise. Make revalidate* a no-op.
vi.mock('next/cache', () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
}));

let authed = true;
vi.mock('@/lib/session', () => ({
  getCurrentUser: async () =>
    authed ? { id: 'u1', email: 'admin@vacu.com.vn', name: 'A', role: 'admin' } : null,
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

type TemplatedMailCall = { key: string; to: string; vars: Record<string, string> };
const templatedMailCalls: TemplatedMailCall[] = [];
let templatedMailResult: { ok: true; messageId: string } | { ok: false; error: string } =
  { ok: true, messageId: 'mock' };

vi.mock('@/lib/mail', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/mail')>();
  return {
    ...orig,
    sendTemplatedMail: async (key: string, to: string, vars: Record<string, string>) => {
      templatedMailCalls.push({ key, to, vars });
      return templatedMailResult;
    },
  };
});

let ctx: TestDb;

async function seedSiteInfo(smtpEnabled: boolean) {
  const { db } = await import('@/db/client');
  const { siteInfo } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const rows = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  if (rows.length) {
    await db.update(siteInfo).set({ smtpEnabled }).where(eq(siteInfo.id, 1));
  } else {
    await db.insert(siteInfo).values({
      id: 1, name: 'Vacu', shortName: 'Vacu', tagline: 't', description: 'd',
      address: 'a', phone: 'p', email: 'admin@vacu.com.vn', hours: 'h',
      statFarmers: '1', statProducts: '1', statCustomers: '1', statYears: '1',
      smtpEnabled, smtpHost: 'smtp.test', smtpPort: 587, smtpFrom: 'noreply@vacu.com.vn',
    });
  }
}

async function seedOrder(id: string, opts: Partial<{
  customerEmail: string | null;
  status: 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid';
  total: number;
}> = {}) {
  const { db } = await import('@/db/client');
  const { orders } = await import('@/db/schema');
  await db.insert(orders).values({
    id,
    customerName: 'Khách hàng',
    phone: '0123456789',
    address: 'Địa chỉ test',
    deliverySlot: 'Sáng',
    total: opts.total ?? 150_000,
    status: opts.status ?? 'pending',
    paymentMethod: 'cod',
    paymentStatus: opts.paymentStatus ?? 'unpaid',
    customerEmail: opts.customerEmail === undefined ? 'cust@example.com' : opts.customerEmail,
  });
}

beforeAll(async () => {
  ctx = await bootPg();
  await seedSiteInfo(true);
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

beforeEach(() => {
  authed = true;
  templatedMailCalls.length = 0;
  templatedMailResult = { ok: true, messageId: 'mock' };
});

describe('updateOrderStatus (admin)', () => {
  it('blocks unauthenticated', async () => {
    authed = false;
    const { updateOrderStatus } = await import('@/app/admin/actions/orders');
    const fd = new FormData();
    fd.set('status', 'delivered');
    await expect(updateOrderStatus('anything', fd)).rejects.toThrow();
  });

  it('rejects invalid status enum', async () => {
    await seedOrder('ord-status-bad');
    const { updateOrderStatus } = await import('@/app/admin/actions/orders');
    const fd = new FormData();
    fd.set('status', 'wizard'); // not in enum
    await expect(updateOrderStatus('ord-status-bad', fd)).rejects.toThrow(/Trạng thái không hợp lệ/);
  });

  it.each([
    'preparing',
    'delivering',
    'delivered',
    'cancelled',
    'pending',
  ] as const)('updates status → %s and bumps updatedAt', async (status) => {
    const id = `ord-status-${status}`;
    await seedOrder(id);
    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const [before] = await db.select().from(orders).where(eq(orders.id, id));
    await new Promise((r) => setTimeout(r, 3));
    const { updateOrderStatus } = await import('@/app/admin/actions/orders');
    const fd = new FormData();
    fd.set('status', status);
    await updateOrderStatus(id, fd);

    const [after] = await db.select().from(orders).where(eq(orders.id, id));
    expect(after.status).toBe(status);
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });
});

describe('markOrderPaid', () => {
  it('blocks unauthenticated', async () => {
    authed = false;
    const { markOrderPaid } = await import('@/app/admin/actions/orders');
    await expect(markOrderPaid('x')).rejects.toThrow();
  });

  it('marks paid and sends payment_confirmed mail with order vars', async () => {
    await seedSiteInfo(true);
    await seedOrder('ord-paid-1', { customerEmail: 'happy@example.com', total: 250_000 });
    const { markOrderPaid } = await import('@/app/admin/actions/orders');
    await markOrderPaid('ord-paid-1');

    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(orders).where(eq(orders.id, 'ord-paid-1'));
    expect(row.paymentStatus).toBe('paid');

    expect(templatedMailCalls).toHaveLength(1);
    const [c] = templatedMailCalls;
    expect(c.key).toBe('payment_confirmed');
    expect(c.to).toBe('happy@example.com');
    expect(c.vars.orderId).toBe('ord-paid-1');
    expect(c.vars.customerName).toBe('Khách hàng');
    expect(c.vars.siteName).toBe('Vacu');
    expect(c.vars.orderTotal).toMatch(/250[.,]000/);
  });

  it('does NOT send mail when smtpEnabled = false', async () => {
    await seedSiteInfo(false);
    await seedOrder('ord-paid-noSmtp', { customerEmail: 'x@example.com' });
    const { markOrderPaid } = await import('@/app/admin/actions/orders');
    await markOrderPaid('ord-paid-noSmtp');
    expect(templatedMailCalls).toHaveLength(0);
    // restore for subsequent tests
    await seedSiteInfo(true);
  });

  it('does NOT send mail when customerEmail is null', async () => {
    await seedOrder('ord-paid-noEmail', { customerEmail: null });
    const { markOrderPaid } = await import('@/app/admin/actions/orders');
    await markOrderPaid('ord-paid-noEmail');
    expect(templatedMailCalls).toHaveLength(0);
  });

  it('swallows mail error — does not throw, payment still recorded', async () => {
    templatedMailResult = { ok: false, error: 'smtp down' };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await seedOrder('ord-paid-mailerr', { customerEmail: 'x@example.com' });
    const { markOrderPaid } = await import('@/app/admin/actions/orders');
    await expect(markOrderPaid('ord-paid-mailerr')).resolves.toBeUndefined();

    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(orders).where(eq(orders.id, 'ord-paid-mailerr'));
    expect(row.paymentStatus).toBe('paid');
    errSpy.mockRestore();
  });
});

describe('markOrderUnpaid', () => {
  it('blocks unauthenticated', async () => {
    authed = false;
    const { markOrderUnpaid } = await import('@/app/admin/actions/orders');
    await expect(markOrderUnpaid('x')).rejects.toThrow();
  });

  it('flips paid → unpaid, sends NO mail', async () => {
    await seedOrder('ord-unpaid-1', { paymentStatus: 'paid' });
    const { markOrderUnpaid } = await import('@/app/admin/actions/orders');
    await markOrderUnpaid('ord-unpaid-1');
    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(orders).where(eq(orders.id, 'ord-unpaid-1'));
    expect(row.paymentStatus).toBe('unpaid');
    expect(templatedMailCalls).toHaveLength(0);
  });
});

describe('deleteOrder / bulkDeleteOrders', () => {
  it('blocks unauthenticated', async () => {
    authed = false;
    const mod = await import('@/app/admin/actions/orders');
    await expect(mod.deleteOrder('x')).rejects.toThrow();
    await expect(mod.bulkDeleteOrders(new FormData())).rejects.toThrow();
  });

  it('deleteOrder removes and redirects', async () => {
    await seedOrder('ord-del-1');
    const { deleteOrder } = await import('@/app/admin/actions/orders');
    await expect(deleteOrder('ord-del-1')).rejects.toThrow();
    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const rows = await db.select().from(orders).where(eq(orders.id, 'ord-del-1'));
    expect(rows).toHaveLength(0);
  });

  it('deleteOrder on non-existent id: still redirects (silent)', async () => {
    const { deleteOrder } = await import('@/app/admin/actions/orders');
    await expect(deleteOrder('ord-ghost')).rejects.toThrow();
  });

  it('bulkDeleteOrders removes matching, filters empty ids', async () => {
    await seedOrder('ord-bulk-1');
    await seedOrder('ord-bulk-2');
    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    const { bulkDeleteOrders } = await import('@/app/admin/actions/orders');
    const fd = new FormData();
    fd.append('ids', 'ord-bulk-1');
    fd.append('ids', '');
    fd.append('ids', 'ord-bulk-2');
    await expect(bulkDeleteOrders(fd)).rejects.toThrow();

    const remaining = await db
      .select()
      .from(orders)
      .where(inArray(orders.id, ['ord-bulk-1', 'ord-bulk-2']));
    expect(remaining).toHaveLength(0);
  });

  it('bulkDeleteOrders with empty ids short-circuits (no delete)', async () => {
    await seedOrder('ord-keep');
    const { bulkDeleteOrders } = await import('@/app/admin/actions/orders');
    await expect(bulkDeleteOrders(new FormData())).rejects.toThrow();
    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select().from(orders).where(eq(orders.id, 'ord-keep'));
    expect(row).toBeDefined();
  });
});
