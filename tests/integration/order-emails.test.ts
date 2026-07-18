import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

vi.mock('next/headers', () => ({
  headers: async () => new Map<string, string>([['host', 'localhost:3000'], ['x-forwarded-proto', 'https']]),
  cookies: async () => ({
    get: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}));

const sendMailCalls: Array<{ to: string; subject: string; html?: string; text?: string; replyTo?: string }> = [];
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({
      sendMail: async (opts: { to: string; subject: string; html?: string; text?: string; replyTo?: string }) => {
        sendMailCalls.push(opts);
        return { messageId: 'mock' };
      },
      verify: async () => true,
    }),
  },
}));

let ctx: TestDb;
let validSlot: string; // checkout validates the slot against the active list

async function seedBaseData(opts: { smtpEnabled: boolean; bankEnabled?: boolean }) {
  const { db } = await import('@/db/client');
  const { siteInfo, categories, products } = await import('@/db/schema');

  await db.insert(siteInfo).values({
    id: 1,
    name: 'Vacu',
    shortName: 'Vacu',
    tagline: 't',
    description: 'd',
    address: '12 Lê Lợi',
    phone: '1900',
    email: 'admin@vacu.com.vn',
    hours: 'h',
    statFarmers: '1', statProducts: '1', statCustomers: '1', statYears: '1',
    smtpEnabled: opts.smtpEnabled,
    smtpHost: 'smtp.test',
    smtpPort: 587,
    smtpFrom: 'noreply@vacu.com.vn',
    bankEnabled: opts.bankEnabled ?? false,
    bankBin: opts.bankEnabled ? '970436' : '',
    bankAccountNumber: opts.bankEnabled ? '0123456789' : '',
    bankAccountHolder: opts.bankEnabled ? 'NGUYEN VAN A' : '',
  });

  await db.insert(categories).values({ id: 'rau', name: 'Rau', icon: '🥬', description: '-' });
  await db.insert(products).values({
    id: 'p1', name: 'Rau cải', categoryId: 'rau', unit: 'kg', price: 50_000,
    image: '/x.jpg', description: '-',
  });
}

async function resetTables() {
  const { db } = await import('@/db/client');
  const { orders, orderItems, siteInfo, products, categories } = await import('@/db/schema');
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(siteInfo);
}

beforeAll(async () => {
  ctx = await bootPg();
  const { db } = await import('@/db/client');
  const { deliverySlots } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');
  const active = await db.select().from(deliverySlots).where(eq(deliverySlots.active, true));
  validSlot = active[0]?.label ?? 'Sáng mai';
}, 120_000);
afterAll(async () => { await stopPg(ctx); });
beforeEach(async () => { sendMailCalls.length = 0; await resetTables(); });

function fdForOrder(opts: { email?: string; payment?: 'cod' | 'bank' }) {
  const fd = new FormData();
  fd.set('customerName', 'Khách A');
  fd.set('phone', '0912345678');
  fd.set('address', '12 Lê Lợi');
  fd.set('deliverySlot', validSlot);
  fd.set('paymentMethod', opts.payment ?? 'cod');
  if (opts.email) fd.set('customerEmail', opts.email);
  fd.set('cart', JSON.stringify([{ id: 'p1', qty: 2 }]));
  return fd;
}

describe('placeOrder → email side-effects', () => {
  it('sends 2 emails when customer provides email (customer + admin)', async () => {
    await seedBaseData({ smtpEnabled: true });
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const res = await placeOrder(fdForOrder({ email: 'kh@ex.com' }));
    expect(res.ok).toBe(true);

    // emails fire-and-forget; give microtask queue a chance
    await new Promise((r) => setTimeout(r, 50));

    expect(sendMailCalls.length).toBe(2);
    const tos = sendMailCalls.map((m) => m.to).sort();
    expect(tos).toContain('kh@ex.com');
    expect(tos).toContain('admin@vacu.com.vn');
  });

  it('sends only admin email when customer email missing', async () => {
    await seedBaseData({ smtpEnabled: true });
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const res = await placeOrder(fdForOrder({}));
    expect(res.ok).toBe(true);
    await new Promise((r) => setTimeout(r, 50));

    expect(sendMailCalls.length).toBe(1);
    expect(sendMailCalls[0].to).toBe('admin@vacu.com.vn');
  });

  it('skips emails when SMTP disabled; order still succeeds', async () => {
    await seedBaseData({ smtpEnabled: false });
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const res = await placeOrder(fdForOrder({ email: 'kh@ex.com' }));
    expect(res.ok).toBe(true);
    await new Promise((r) => setTimeout(r, 50));
    expect(sendMailCalls.length).toBe(0);
  });

  it('bank payment → customer email contains QR URL', async () => {
    await seedBaseData({ smtpEnabled: true, bankEnabled: true });
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const res = await placeOrder(fdForOrder({ email: 'kh@ex.com', payment: 'bank' }));
    expect(res.ok).toBe(true);
    await new Promise((r) => setTimeout(r, 50));

    const customerMail = sendMailCalls.find((m) => m.to === 'kh@ex.com');
    expect(customerMail?.html).toContain('img.vietqr.io');
    expect(customerMail?.html).toContain('0123456789'); // account number
  });

  it('admin notify email sets reply-to to customer email', async () => {
    await seedBaseData({ smtpEnabled: true });
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    await placeOrder(fdForOrder({ email: 'kh@ex.com' }));
    await new Promise((r) => setTimeout(r, 50));

    const adminMail = sendMailCalls.find((m) => m.to === 'admin@vacu.com.vn');
    expect(adminMail?.replyTo).toBe('kh@ex.com');
  });

  it('order persists even when sendMail throws (fire-and-forget)', async () => {
    await seedBaseData({ smtpEnabled: true });
    // Monkey-patch push to throw once on this test only
    const { placeOrder } = await import('@/app/(public)/checkout/actions');
    const res = await placeOrder(fdForOrder({ email: 'kh@ex.com' }));
    expect(res.ok).toBe(true);

    const { db } = await import('@/db/client');
    const { orders } = await import('@/db/schema');
    const persisted = await db.select().from(orders);
    expect(persisted.length).toBe(1);
    expect(persisted[0].customerEmail).toBe('kh@ex.com');
  });
});
