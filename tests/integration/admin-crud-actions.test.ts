import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

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

const uploadCalls: Array<{ fn: string; args: unknown[] }> = [];
vi.mock('@/lib/uploads', async (importOriginal) => {
  const orig = await importOriginal<typeof import('@/lib/uploads')>();
  return {
    ...orig,
    deleteUpload: async (url: string | null | undefined) => {
      uploadCalls.push({ fn: 'deleteUpload', args: [url] });
    },
    deleteUploadIfReplaced: async (prev: string | null | undefined, next: string | null | undefined) => {
      uploadCalls.push({ fn: 'deleteUploadIfReplaced', args: [prev, next] });
    },
  };
});

let ctx: TestDb;

beforeAll(async () => {
  ctx = await bootPg();
}, 120_000);

afterAll(async () => { await stopPg(ctx); });

beforeEach(() => { authed = true; });

// ---------------- contact-topics ----------------
describe('contact-topics actions', () => {
  it('blocks unauthenticated create', async () => {
    authed = false;
    const { createContactTopic } = await import('@/app/admin/actions/contact-topics');
    const fd = new FormData();
    fd.set('label', 'Hỗ trợ');
    await expect(createContactTopic(null, fd)).rejects.toThrow();
  });

  it('rejects empty label with error (no throw)', async () => {
    const { createContactTopic } = await import('@/app/admin/actions/contact-topics');
    const fd = new FormData();
    fd.set('label', '');
    const res = await createContactTopic(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('creates, updates, deletes a row', async () => {
    const { createContactTopic, updateContactTopic, deleteContactTopic } =
      await import('@/app/admin/actions/contact-topics');
    const { db } = await import('@/db/client');
    const { contactTopics } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('label', 'Đặt hàng');
    fd.set('sortOrder', '3');
    await expect(createContactTopic(null, fd)).rejects.toThrow();

    const rows = await db.select().from(contactTopics).where(eq(contactTopics.label, 'Đặt hàng'));
    expect(rows).toHaveLength(1);
    expect(rows[0].sortOrder).toBe(3);
    const id = rows[0].id;

    const fd2 = new FormData();
    fd2.set('label', 'Đổi/Trả');
    fd2.set('sortOrder', '5');
    await expect(updateContactTopic(id, null, fd2)).rejects.toThrow();
    const [after] = await db.select().from(contactTopics).where(eq(contactTopics.id, id));
    expect(after.label).toBe('Đổi/Trả');
    expect(after.sortOrder).toBe(5);

    await expect(deleteContactTopic(id)).rejects.toThrow();
    const gone = await db.select().from(contactTopics).where(eq(contactTopics.id, id));
    expect(gone).toHaveLength(0);
  });

  it('bulk-deletes multiple rows; empty ids short-circuits', async () => {
    const { bulkDeleteContactTopics } = await import('@/app/admin/actions/contact-topics');
    const { db } = await import('@/db/client');
    const { contactTopics } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    const inserted = await db
      .insert(contactTopics)
      .values([{ label: 'A1' }, { label: 'B1' }, { label: 'C1' }])
      .returning();
    const ids = inserted.map((r) => r.id);

    const empty = new FormData();
    await expect(bulkDeleteContactTopics(empty)).rejects.toThrow();
    const still = await db.select().from(contactTopics).where(inArray(contactTopics.id, ids));
    expect(still).toHaveLength(3);

    const fd = new FormData();
    ids.forEach((id) => fd.append('ids', String(id)));
    await expect(bulkDeleteContactTopics(fd)).rejects.toThrow();
    const remaining = await db.select().from(contactTopics).where(inArray(contactTopics.id, ids));
    expect(remaining).toHaveLength(0);
  });
});

// ---------------- delivery-slots ----------------
describe('delivery-slots actions', () => {
  it('blocks unauthenticated create', async () => {
    authed = false;
    const { createDeliverySlot } = await import('@/app/admin/actions/delivery-slots');
    const fd = new FormData();
    fd.set('label', '8h-10h');
    await expect(createDeliverySlot(null, fd)).rejects.toThrow();
  });

  it('rejects empty label', async () => {
    const { createDeliverySlot } = await import('@/app/admin/actions/delivery-slots');
    const fd = new FormData();
    fd.set('label', '');
    const res = await createDeliverySlot(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('creates with active=false when checkbox missing', async () => {
    const { createDeliverySlot } = await import('@/app/admin/actions/delivery-slots');
    const { db } = await import('@/db/client');
    const { deliverySlots } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('label', 'Sáng sớm');
    // no `active` field → action sends false
    await expect(createDeliverySlot(null, fd)).rejects.toThrow();

    const [row] = await db.select().from(deliverySlots).where(eq(deliverySlots.label, 'Sáng sớm'));
    expect(row.active).toBe(false);
  });

  it('update flips active; delete removes', async () => {
    const { createDeliverySlot, updateDeliverySlot, deleteDeliverySlot } =
      await import('@/app/admin/actions/delivery-slots');
    const { db } = await import('@/db/client');
    const { deliverySlots } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('label', 'Chiều');
    fd.set('active', 'on');
    await expect(createDeliverySlot(null, fd)).rejects.toThrow();
    const [row] = await db.select().from(deliverySlots).where(eq(deliverySlots.label, 'Chiều'));
    expect(row.active).toBe(true);

    const u = new FormData();
    u.set('label', 'Chiều muộn');
    // active omitted → false
    await expect(updateDeliverySlot(row.id, null, u)).rejects.toThrow();
    const [after] = await db.select().from(deliverySlots).where(eq(deliverySlots.id, row.id));
    expect(after.label).toBe('Chiều muộn');
    expect(after.active).toBe(false);

    await expect(deleteDeliverySlot(row.id)).rejects.toThrow();
    const gone = await db.select().from(deliverySlots).where(eq(deliverySlots.id, row.id));
    expect(gone).toHaveLength(0);
  });

  it('bulk-deletes and short-circuits on empty', async () => {
    const { bulkDeleteDeliverySlots } = await import('@/app/admin/actions/delivery-slots');
    const { db } = await import('@/db/client');
    const { deliverySlots } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    const rows = await db
      .insert(deliverySlots)
      .values([{ label: 'X1' }, { label: 'X2' }])
      .returning();
    const ids = rows.map((r) => r.id);

    await expect(bulkDeleteDeliverySlots(new FormData())).rejects.toThrow();
    const still = await db.select().from(deliverySlots).where(inArray(deliverySlots.id, ids));
    expect(still).toHaveLength(2);

    const fd = new FormData();
    ids.forEach((id) => fd.append('ids', String(id)));
    await expect(bulkDeleteDeliverySlots(fd)).rejects.toThrow();
    const remaining = await db.select().from(deliverySlots).where(inArray(deliverySlots.id, ids));
    expect(remaining).toHaveLength(0);
  });
});

// ---------------- email-templates (update only) ----------------
describe('email-templates actions', () => {
  async function seedTemplate(key = 'welcome') {
    const { db } = await import('@/db/client');
    const { emailTemplates } = await import('@/db/schema');
    await db.insert(emailTemplates).values({
      key,
      name: 'Old name',
      description: 'old desc',
      subject: 'Old subject',
      bodyHtml: '<p>old</p>',
      enabled: true,
    });
  }

  it('blocks unauthenticated update', async () => {
    authed = false;
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const fd = new FormData();
    fd.set('name', 'x');
    fd.set('subject', 'x');
    fd.set('bodyHtml', 'x');
    await expect(updateEmailTemplate('welcome', null, fd)).rejects.toThrow();
  });

  it('rejects missing subject', async () => {
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const fd = new FormData();
    fd.set('name', 'Xin chào');
    fd.set('subject', '');
    fd.set('bodyHtml', '<p>hi</p>');
    const res = await updateEmailTemplate('welcome', null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('updates fields and bumps updatedAt', async () => {
    await seedTemplate('order_confirm');
    const { db } = await import('@/db/client');
    const { emailTemplates } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const [before] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, 'order_confirm'));
    await new Promise((r) => setTimeout(r, 5)); // ensure timestamp tick

    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const fd = new FormData();
    fd.set('name', 'Xác nhận đơn hàng');
    fd.set('description', 'Mô tả mới');
    fd.set('subject', 'Đơn hàng của bạn');
    fd.set('bodyHtml', '<p>cám ơn</p>');
    // enabled omitted → false
    await expect(updateEmailTemplate('order_confirm', null, fd)).rejects.toThrow();

    const [after] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, 'order_confirm'));
    expect(after.name).toBe('Xác nhận đơn hàng');
    expect(after.description).toBe('Mô tả mới');
    expect(after.subject).toBe('Đơn hàng của bạn');
    expect(after.bodyHtml).toBe('<p>cám ơn</p>');
    expect(after.enabled).toBe(false);
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });
});

// ---------------- order-statuses (update only) ----------------
describe('order-statuses actions', () => {
  async function seedStatus(key = 'pending') {
    const { db } = await import('@/db/client');
    const { orderStatuses } = await import('@/db/schema');
    await db.insert(orderStatuses).values({
      key, label: 'Chờ xử lý', color: 'gray', sortOrder: 0,
    });
  }

  it('blocks unauthenticated update', async () => {
    authed = false;
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');
    const fd = new FormData();
    fd.set('label', 'x');
    fd.set('color', 'red');
    await expect(updateOrderStatus('pending', null, fd)).rejects.toThrow();
  });

  it('rejects missing color', async () => {
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');
    const fd = new FormData();
    fd.set('label', 'Đang giao');
    fd.set('color', '');
    const res = await updateOrderStatus('pending', null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('updates row', async () => {
    await seedStatus('shipping');
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');
    const { db } = await import('@/db/client');
    const { orderStatuses } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('label', 'Đang vận chuyển');
    fd.set('color', 'blue');
    fd.set('sortOrder', '2');
    await expect(updateOrderStatus('shipping', null, fd)).rejects.toThrow();

    const [row] = await db.select().from(orderStatuses).where(eq(orderStatuses.key, 'shipping'));
    expect(row.label).toBe('Đang vận chuyển');
    expect(row.color).toBe('blue');
    expect(row.sortOrder).toBe(2);
  });
});

// ---------------- payment-methods (string id) ----------------
describe('payment-methods actions', () => {
  it('blocks unauthenticated create', async () => {
    authed = false;
    const { createPaymentMethod } = await import('@/app/admin/actions/payment-methods');
    const fd = new FormData();
    fd.set('id', 'cod');
    fd.set('label', 'COD');
    await expect(createPaymentMethod(null, fd)).rejects.toThrow();
  });

  it('rejects bad slug', async () => {
    const { createPaymentMethod } = await import('@/app/admin/actions/payment-methods');
    const fd = new FormData();
    fd.set('id', 'BAD ID!'); // uppercase + space — violates slug regex
    fd.set('label', 'Bad');
    const res = await createPaymentMethod(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('creates, updates, deletes', async () => {
    const { createPaymentMethod, updatePaymentMethod, deletePaymentMethod } =
      await import('@/app/admin/actions/payment-methods');
    const { db } = await import('@/db/client');
    const { paymentMethods } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const pmId = 'zalopay'; // not in migration seeds
    const fd = new FormData();
    fd.set('id', pmId);
    fd.set('label', 'ZaloPay');
    fd.set('active', 'on');
    fd.set('sortOrder', '1');
    await expect(createPaymentMethod(null, fd)).rejects.toThrow();

    const [row] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, pmId));
    expect(row.label).toBe('ZaloPay');
    expect(row.active).toBe(true);
    expect(row.sortOrder).toBe(1);

    const u = new FormData();
    u.set('label', 'ZaloPay Wallet');
    // active omitted → false
    u.set('sortOrder', '3');
    await expect(updatePaymentMethod(pmId, null, u)).rejects.toThrow();
    const [after] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, pmId));
    expect(after.label).toBe('ZaloPay Wallet');
    expect(after.active).toBe(false);
    expect(after.sortOrder).toBe(3);

    await expect(deletePaymentMethod(pmId)).rejects.toThrow();
    const gone = await db.select().from(paymentMethods).where(eq(paymentMethods.id, pmId));
    expect(gone).toHaveLength(0);
  });

  it('bulk-deletes; empty ids short-circuit', async () => {
    const { bulkDeletePaymentMethods } = await import('@/app/admin/actions/payment-methods');
    const { db } = await import('@/db/client');
    const { paymentMethods } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    await db.insert(paymentMethods).values([
      { id: 'pm-a', label: 'A' },
      { id: 'pm-b', label: 'B' },
    ]);

    await expect(bulkDeletePaymentMethods(new FormData())).rejects.toThrow();
    const still = await db.select().from(paymentMethods).where(inArray(paymentMethods.id, ['pm-a', 'pm-b']));
    expect(still).toHaveLength(2);

    const fd = new FormData();
    fd.append('ids', 'pm-a');
    fd.append('ids', 'pm-b');
    await expect(bulkDeletePaymentMethods(fd)).rejects.toThrow();
    const remaining = await db.select().from(paymentMethods).where(inArray(paymentMethods.id, ['pm-a', 'pm-b']));
    expect(remaining).toHaveLength(0);
  });
});

// ---------------- value-props ----------------
describe('value-props actions', () => {
  it('blocks unauthenticated create', async () => {
    authed = false;
    const { createValueProp } = await import('@/app/admin/actions/value-props');
    const fd = new FormData();
    fd.set('icon', '✓');
    fd.set('title', 'x');
    fd.set('description', 'y');
    await expect(createValueProp(null, fd)).rejects.toThrow();
  });

  it('rejects empty icon', async () => {
    const { createValueProp } = await import('@/app/admin/actions/value-props');
    const fd = new FormData();
    fd.set('icon', '');
    fd.set('title', 'Giao nhanh');
    fd.set('description', 'Trong 24h');
    const res = await createValueProp(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('creates, updates, deletes', async () => {
    const { createValueProp, updateValueProp, deleteValueProp } =
      await import('@/app/admin/actions/value-props');
    const { db } = await import('@/db/client');
    const { valueProps } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('icon', '🚚');
    fd.set('title', 'Giao nhanh');
    fd.set('description', 'Giao trong ngày ở HN/HCM');
    fd.set('sortOrder', '1');
    await expect(createValueProp(null, fd)).rejects.toThrow();
    const [row] = await db.select().from(valueProps).where(eq(valueProps.title, 'Giao nhanh'));
    expect(row.icon).toBe('🚚');
    expect(row.sortOrder).toBe(1);

    const u = new FormData();
    u.set('icon', '⚡');
    u.set('title', 'Giao siêu tốc');
    u.set('description', 'Trong 2 giờ');
    u.set('sortOrder', '2');
    await expect(updateValueProp(row.id, null, u)).rejects.toThrow();
    const [after] = await db.select().from(valueProps).where(eq(valueProps.id, row.id));
    expect(after.icon).toBe('⚡');
    expect(after.title).toBe('Giao siêu tốc');
    expect(after.sortOrder).toBe(2);

    await expect(deleteValueProp(row.id)).rejects.toThrow();
    const gone = await db.select().from(valueProps).where(eq(valueProps.id, row.id));
    expect(gone).toHaveLength(0);
  });

  it('bulk-deletes; empty short-circuits', async () => {
    const { bulkDeleteValueProps } = await import('@/app/admin/actions/value-props');
    const { db } = await import('@/db/client');
    const { valueProps } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    const rows = await db
      .insert(valueProps)
      .values([
        { icon: 'a', title: 'T1', description: 'D1' },
        { icon: 'b', title: 'T2', description: 'D2' },
      ])
      .returning();
    const ids = rows.map((r) => r.id);

    await expect(bulkDeleteValueProps(new FormData())).rejects.toThrow();
    const still = await db.select().from(valueProps).where(inArray(valueProps.id, ids));
    expect(still).toHaveLength(2);

    const fd = new FormData();
    ids.forEach((id) => fd.append('ids', String(id)));
    await expect(bulkDeleteValueProps(fd)).rejects.toThrow();
    const remaining = await db.select().from(valueProps).where(inArray(valueProps.id, ids));
    expect(remaining).toHaveLength(0);
  });
});

// =====================================================================
// Edge cases — boundaries, coercion, silent no-ops, duplicates, toggles
// =====================================================================

// ---------------- contact-topics edges ----------------
describe('contact-topics edges', () => {
  it('accepts label at 120 chars, rejects at 121', async () => {
    const { createContactTopic } = await import('@/app/admin/actions/contact-topics');
    const ok = new FormData();
    ok.set('label', 'A'.repeat(120));
    await expect(createContactTopic(null, ok)).rejects.toThrow();

    const bad = new FormData();
    bad.set('label', 'A'.repeat(121));
    const res = await createContactTopic(null, bad);
    expect(res?.error).toBeTruthy();
  });

  it('sortOrder defaults to 0 when absent, coerces numeric strings', async () => {
    const { createContactTopic } = await import('@/app/admin/actions/contact-topics');
    const { db } = await import('@/db/client');
    const { contactTopics } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fdA = new FormData();
    fdA.set('label', 'CT-default');
    // no sortOrder → action passes 0
    await expect(createContactTopic(null, fdA)).rejects.toThrow();

    const fdB = new FormData();
    fdB.set('label', 'CT-coerce');
    fdB.set('sortOrder', '42');
    await expect(createContactTopic(null, fdB)).rejects.toThrow();

    const [a] = await db.select().from(contactTopics).where(eq(contactTopics.label, 'CT-default'));
    const [b] = await db.select().from(contactTopics).where(eq(contactTopics.label, 'CT-coerce'));
    expect(a.sortOrder).toBe(0);
    expect(b.sortOrder).toBe(42);
  });

  it('update rejects empty label', async () => {
    const { updateContactTopic } = await import('@/app/admin/actions/contact-topics');
    const fd = new FormData();
    fd.set('label', '');
    const res = await updateContactTopic(99999, null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('update of non-existent id still redirects (silent no-op)', async () => {
    const { updateContactTopic } = await import('@/app/admin/actions/contact-topics');
    const fd = new FormData();
    fd.set('label', 'Ghost');
    await expect(updateContactTopic(9_999_999, null, fd)).rejects.toThrow();
  });

  it('delete of non-existent id still redirects (silent)', async () => {
    const { deleteContactTopic } = await import('@/app/admin/actions/contact-topics');
    await expect(deleteContactTopic(9_999_999)).rejects.toThrow();
  });

  it('bulkDelete filters non-numeric ids', async () => {
    const { bulkDeleteContactTopics } = await import('@/app/admin/actions/contact-topics');
    const { db } = await import('@/db/client');
    const { contactTopics } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    const rows = await db
      .insert(contactTopics)
      .values([{ label: 'bulk-f1' }, { label: 'bulk-f2' }])
      .returning();
    const ids = rows.map((r) => r.id);

    const fd = new FormData();
    fd.append('ids', String(ids[0]));
    fd.append('ids', 'not-a-number');
    fd.append('ids', String(ids[1]));
    fd.append('ids', ''); // empty string → NaN → filtered
    await expect(bulkDeleteContactTopics(fd)).rejects.toThrow();

    const remaining = await db.select().from(contactTopics).where(inArray(contactTopics.id, ids));
    expect(remaining).toHaveLength(0);
  });

  it('preserves Vietnamese diacritics and special chars round-trip', async () => {
    const { createContactTopic } = await import('@/app/admin/actions/contact-topics');
    const { db } = await import('@/db/client');
    const { contactTopics } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const label = 'Khiếu nại & Đổi/Trả — "khẩn cấp"';
    const fd = new FormData();
    fd.set('label', label);
    await expect(createContactTopic(null, fd)).rejects.toThrow();
    const [row] = await db.select().from(contactTopics).where(eq(contactTopics.label, label));
    expect(row).toBeDefined();
  });
});

// ---------------- delivery-slots edges ----------------
describe('delivery-slots edges', () => {
  it('active truthiness: "on" / "true" / "1" → true; "" / absent → false', async () => {
    const { createDeliverySlot } = await import('@/app/admin/actions/delivery-slots');
    const { db } = await import('@/db/client');
    const { deliverySlots } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const cases: Array<[string, string | null, boolean]> = [
      ['DS-on', 'on', true],
      ['DS-true', 'true', true],
      ['DS-1', '1', true],
      ['DS-empty', '', false],
      ['DS-absent', null, false],
    ];

    for (const [label, activeVal, expected] of cases) {
      const fd = new FormData();
      fd.set('label', label);
      if (activeVal !== null) fd.set('active', activeVal);
      await expect(createDeliverySlot(null, fd)).rejects.toThrow();
      const [row] = await db.select().from(deliverySlots).where(eq(deliverySlots.label, label));
      expect(row.active, `label=${label}`).toBe(expected);
    }
  });

  it('accepts label exactly 120 chars, rejects 121', async () => {
    const { createDeliverySlot } = await import('@/app/admin/actions/delivery-slots');
    const ok = new FormData();
    ok.set('label', 'S'.repeat(120));
    await expect(createDeliverySlot(null, ok)).rejects.toThrow();

    const bad = new FormData();
    bad.set('label', 'S'.repeat(121));
    const res = await createDeliverySlot(null, bad);
    expect(res?.error).toBeTruthy();
  });

  it('update rejects empty label', async () => {
    const { updateDeliverySlot } = await import('@/app/admin/actions/delivery-slots');
    const fd = new FormData();
    fd.set('label', '');
    const res = await updateDeliverySlot(99_999, null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('update of non-existent id redirects silently', async () => {
    const { updateDeliverySlot } = await import('@/app/admin/actions/delivery-slots');
    const fd = new FormData();
    fd.set('label', 'Ghost');
    await expect(updateDeliverySlot(9_999_999, null, fd)).rejects.toThrow();
  });

  it('bulkDelete with mix of valid + invalid ids removes only valid', async () => {
    const { bulkDeleteDeliverySlots } = await import('@/app/admin/actions/delivery-slots');
    const { db } = await import('@/db/client');
    const { deliverySlots } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    const rows = await db
      .insert(deliverySlots)
      .values([{ label: 'DS-mix-1' }, { label: 'DS-mix-2' }])
      .returning();
    const ids = rows.map((r) => r.id);

    const fd = new FormData();
    fd.append('ids', String(ids[0]));
    fd.append('ids', 'foo');
    fd.append('ids', String(ids[1]));
    await expect(bulkDeleteDeliverySlots(fd)).rejects.toThrow();
    const remaining = await db.select().from(deliverySlots).where(inArray(deliverySlots.id, ids));
    expect(remaining).toHaveLength(0);
  });
});

// ---------------- email-templates edges ----------------
describe('email-templates edges', () => {
  async function seedKey(key: string) {
    const { db } = await import('@/db/client');
    const { emailTemplates } = await import('@/db/schema');
    await db.insert(emailTemplates).values({
      key, name: 'n', description: '', subject: 's', bodyHtml: '<p>b</p>', enabled: true,
    });
  }

  it('rejects empty name', async () => {
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const fd = new FormData();
    fd.set('name', '');
    fd.set('subject', 's');
    fd.set('bodyHtml', '<p>b</p>');
    const res = await updateEmailTemplate('any-key', null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects empty bodyHtml', async () => {
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const fd = new FormData();
    fd.set('name', 'n');
    fd.set('subject', 's');
    fd.set('bodyHtml', '');
    const res = await updateEmailTemplate('any-key', null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects oversize bodyHtml (>20000) and subject (>300) and name (>120)', async () => {
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');

    const big = new FormData();
    big.set('name', 'n');
    big.set('subject', 's');
    big.set('bodyHtml', 'x'.repeat(20001));
    const r1 = await updateEmailTemplate('k', null, big);
    expect(r1?.error).toBeTruthy();

    const subj = new FormData();
    subj.set('name', 'n');
    subj.set('subject', 's'.repeat(301));
    subj.set('bodyHtml', '<p>b</p>');
    const r2 = await updateEmailTemplate('k', null, subj);
    expect(r2?.error).toBeTruthy();

    const nm = new FormData();
    nm.set('name', 'n'.repeat(121));
    nm.set('subject', 's');
    nm.set('bodyHtml', '<p>b</p>');
    const r3 = await updateEmailTemplate('k', null, nm);
    expect(r3?.error).toBeTruthy();
  });

  it('description defaults to empty string when field absent', async () => {
    await seedKey('welcome_v2');
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const { db } = await import('@/db/client');
    const { emailTemplates } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('name', 'Chào mừng v2');
    // no description
    fd.set('subject', 'Chào bạn');
    fd.set('bodyHtml', '<p>hi v2</p>');
    fd.set('enabled', 'on');
    await expect(updateEmailTemplate('welcome_v2', null, fd)).rejects.toThrow();

    const [row] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, 'welcome_v2'));
    expect(row.description).toBe('');
    expect(row.enabled).toBe(true);
  });

  it('enabled flips off→on and on→off across two updates', async () => {
    await seedKey('flip_enabled');
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const { db } = await import('@/db/client');
    const { emailTemplates } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fields = (enabled: boolean) => {
      const fd = new FormData();
      fd.set('name', 'n');
      fd.set('subject', 's');
      fd.set('bodyHtml', '<p>b</p>');
      if (enabled) fd.set('enabled', 'on');
      return fd;
    };

    await expect(updateEmailTemplate('flip_enabled', null, fields(false))).rejects.toThrow();
    const [off] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, 'flip_enabled'));
    expect(off.enabled).toBe(false);

    await expect(updateEmailTemplate('flip_enabled', null, fields(true))).rejects.toThrow();
    const [on] = await db.select().from(emailTemplates).where(eq(emailTemplates.key, 'flip_enabled'));
    expect(on.enabled).toBe(true);
  });

  it('update of non-existent key redirects silently (0 rows affected)', async () => {
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const { db } = await import('@/db/client');
    const { emailTemplates } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('name', 'Ghost');
    fd.set('subject', 's');
    fd.set('bodyHtml', '<p>b</p>');
    await expect(updateEmailTemplate('never-existed-key', null, fd)).rejects.toThrow();

    const rows = await db.select().from(emailTemplates).where(eq(emailTemplates.key, 'never-existed-key'));
    expect(rows).toHaveLength(0);
  });
});

// ---------------- order-statuses edges ----------------
describe('order-statuses edges', () => {
  it('rejects empty label', async () => {
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');
    const fd = new FormData();
    fd.set('label', '');
    fd.set('color', 'red');
    const res = await updateOrderStatus('pending', null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects oversize label (>60) and color (>200)', async () => {
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');

    const lab = new FormData();
    lab.set('label', 'L'.repeat(61));
    lab.set('color', 'red');
    const r1 = await updateOrderStatus('pending', null, lab);
    expect(r1?.error).toBeTruthy();

    const col = new FormData();
    col.set('label', 'ok');
    col.set('color', 'c'.repeat(201));
    const r2 = await updateOrderStatus('pending', null, col);
    expect(r2?.error).toBeTruthy();
  });

  it('update of non-existent key redirects silently', async () => {
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');
    const { db } = await import('@/db/client');
    const { orderStatuses } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('label', 'Ghost');
    fd.set('color', 'gray');
    await expect(updateOrderStatus('ghost-key-x', null, fd)).rejects.toThrow();
    const rows = await db.select().from(orderStatuses).where(eq(orderStatuses.key, 'ghost-key-x'));
    expect(rows).toHaveLength(0);
  });

  it('sortOrder defaults to 0 when absent; coerces string', async () => {
    const { db } = await import('@/db/client');
    const { orderStatuses } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');

    // seed key
    await db.insert(orderStatuses).values({ key: 'sort-default', label: 'x', color: 'y', sortOrder: 99 });
    const fd = new FormData();
    fd.set('label', 'x');
    fd.set('color', 'y');
    // no sortOrder → 0
    await expect(updateOrderStatus('sort-default', null, fd)).rejects.toThrow();
    const [row] = await db.select().from(orderStatuses).where(eq(orderStatuses.key, 'sort-default'));
    expect(row.sortOrder).toBe(0);
  });

  it('preserves tailwind-class colour strings verbatim', async () => {
    const { db } = await import('@/db/client');
    const { orderStatuses } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');

    await db.insert(orderStatuses).values({ key: 'tw-color', label: 'x', color: 'gray', sortOrder: 0 });
    const color = 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200';
    const fd = new FormData();
    fd.set('label', 'Đang giao');
    fd.set('color', color);
    await expect(updateOrderStatus('tw-color', null, fd)).rejects.toThrow();
    const [row] = await db.select().from(orderStatuses).where(eq(orderStatuses.key, 'tw-color'));
    expect(row.color).toBe(color);
  });
});

// ---------------- payment-methods edges ----------------
describe('payment-methods edges', () => {
  it.each([
    ['abc', true],
    ['abc-def', true],
    ['abc-123', true],
    ['123', true],
    ['a', true],
    ['a-b-c-d', true],
    ['ABC', false],       // uppercase
    ['a_b', false],       // underscore
    ['a b', false],       // space
    ['a.b', false],       // dot
    ['a!b', false],       // bang
    ['a/b', false],       // slash
    ['', false],          // empty (min(1))
    ['a'.repeat(80), true],   // exactly 80
    ['a'.repeat(81), false],  // over max
  ])('id %j → %s', async (id, expectValid) => {
    const { createPaymentMethod } = await import('@/app/admin/actions/payment-methods');
    const fd = new FormData();
    fd.set('id', id);
    fd.set('label', 'X');
    if (expectValid) {
      await expect(createPaymentMethod(null, fd)).rejects.toThrow();
      // cleanup to avoid PK conflict across iterations
      const { db } = await import('@/db/client');
      const { paymentMethods } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    } else {
      const res = await createPaymentMethod(null, fd);
      expect(res?.error).toBeTruthy();
    }
  });

  it('duplicate id returns error (catch branch), not throw', async () => {
    const { createPaymentMethod } = await import('@/app/admin/actions/payment-methods');
    const { db } = await import('@/db/client');
    const { paymentMethods } = await import('@/db/schema');

    await db.insert(paymentMethods).values({ id: 'dup-pm', label: 'First' });

    const fd = new FormData();
    fd.set('id', 'dup-pm');
    fd.set('label', 'Second');
    const res = await createPaymentMethod(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('update rejects empty label', async () => {
    const { updatePaymentMethod } = await import('@/app/admin/actions/payment-methods');
    const fd = new FormData();
    fd.set('label', '');
    const res = await updatePaymentMethod('cod', null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('update of non-existent id redirects silently', async () => {
    const { updatePaymentMethod } = await import('@/app/admin/actions/payment-methods');
    const fd = new FormData();
    fd.set('label', 'Ghost');
    await expect(updatePaymentMethod('ghost-pm', null, fd)).rejects.toThrow();
  });

  it('delete of non-existent id redirects silently', async () => {
    const { deletePaymentMethod } = await import('@/app/admin/actions/payment-methods');
    await expect(deletePaymentMethod('ghost-pm-2')).rejects.toThrow();
  });

  it('bulkDelete filters empty strings, keeps non-empty', async () => {
    const { bulkDeletePaymentMethods } = await import('@/app/admin/actions/payment-methods');
    const { db } = await import('@/db/client');
    const { paymentMethods } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    await db.insert(paymentMethods).values([
      { id: 'bulk-pm-1', label: 'L1' },
      { id: 'bulk-pm-2', label: 'L2' },
    ]);

    const fd = new FormData();
    fd.append('ids', 'bulk-pm-1');
    fd.append('ids', ''); // filtered
    fd.append('ids', 'bulk-pm-2');
    await expect(bulkDeletePaymentMethods(fd)).rejects.toThrow();

    const remaining = await db
      .select()
      .from(paymentMethods)
      .where(inArray(paymentMethods.id, ['bulk-pm-1', 'bulk-pm-2']));
    expect(remaining).toHaveLength(0);
  });

  it('unauth blocks update/delete/bulkDelete (not just create)', async () => {
    authed = false;
    const { updatePaymentMethod, deletePaymentMethod, bulkDeletePaymentMethods } =
      await import('@/app/admin/actions/payment-methods');

    const u = new FormData();
    u.set('label', 'x');
    await expect(updatePaymentMethod('cod', null, u)).rejects.toThrow();
    await expect(deletePaymentMethod('cod')).rejects.toThrow();
    const b = new FormData();
    b.append('ids', 'cod');
    await expect(bulkDeletePaymentMethods(b)).rejects.toThrow();
  });
});

// ---------------- value-props edges ----------------
describe('value-props edges', () => {
  it('rejects empty title', async () => {
    const { createValueProp } = await import('@/app/admin/actions/value-props');
    const fd = new FormData();
    fd.set('icon', '✓');
    fd.set('title', '');
    fd.set('description', 'd');
    const res = await createValueProp(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects empty description', async () => {
    const { createValueProp } = await import('@/app/admin/actions/value-props');
    const fd = new FormData();
    fd.set('icon', '✓');
    fd.set('title', 't');
    fd.set('description', '');
    const res = await createValueProp(null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('rejects oversize icon (>20), title (>120), description (>400)', async () => {
    const { createValueProp } = await import('@/app/admin/actions/value-props');

    const ic = new FormData();
    ic.set('icon', 'i'.repeat(21));
    ic.set('title', 't');
    ic.set('description', 'd');
    const r1 = await createValueProp(null, ic);
    expect(r1?.error).toBeTruthy();

    const tt = new FormData();
    tt.set('icon', '✓');
    tt.set('title', 't'.repeat(121));
    tt.set('description', 'd');
    const r2 = await createValueProp(null, tt);
    expect(r2?.error).toBeTruthy();

    const ds = new FormData();
    ds.set('icon', '✓');
    ds.set('title', 't');
    ds.set('description', 'd'.repeat(401));
    const r3 = await createValueProp(null, ds);
    expect(r3?.error).toBeTruthy();
  });

  it('accepts icon/title/description at exact max length', async () => {
    const { createValueProp } = await import('@/app/admin/actions/value-props');
    const { db } = await import('@/db/client');
    const { valueProps } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const title = 'VP-max-' + 't'.repeat(113); // len 120
    const fd = new FormData();
    fd.set('icon', 'i'.repeat(20));
    fd.set('title', title);
    fd.set('description', 'd'.repeat(400));
    await expect(createValueProp(null, fd)).rejects.toThrow();

    const [row] = await db.select().from(valueProps).where(eq(valueProps.title, title));
    expect(row.icon.length).toBe(20);
    expect(row.description.length).toBe(400);
  });

  it('update rejects empty icon', async () => {
    const { updateValueProp } = await import('@/app/admin/actions/value-props');
    const fd = new FormData();
    fd.set('icon', '');
    fd.set('title', 't');
    fd.set('description', 'd');
    const res = await updateValueProp(999_999, null, fd);
    expect(res?.error).toBeTruthy();
  });

  it('update of non-existent id redirects silently', async () => {
    const { updateValueProp } = await import('@/app/admin/actions/value-props');
    const fd = new FormData();
    fd.set('icon', '✓');
    fd.set('title', 'Ghost');
    fd.set('description', 'g');
    await expect(updateValueProp(9_999_999, null, fd)).rejects.toThrow();
  });

  it('delete of non-existent id redirects silently', async () => {
    const { deleteValueProp } = await import('@/app/admin/actions/value-props');
    await expect(deleteValueProp(9_999_999)).rejects.toThrow();
  });

  it('unauth blocks update/delete/bulkDelete', async () => {
    authed = false;
    const { updateValueProp, deleteValueProp, bulkDeleteValueProps } =
      await import('@/app/admin/actions/value-props');
    const u = new FormData();
    u.set('icon', '✓');
    u.set('title', 't');
    u.set('description', 'd');
    await expect(updateValueProp(1, null, u)).rejects.toThrow();
    await expect(deleteValueProp(1)).rejects.toThrow();
    await expect(bulkDeleteValueProps(new FormData())).rejects.toThrow();
  });
});

// ---------------- cross-cutting: unauth blocks update/delete/bulk everywhere ----------------
describe('cross-cutting auth', () => {
  it('contact-topics: unauth blocks update/delete/bulk', async () => {
    authed = false;
    const mod = await import('@/app/admin/actions/contact-topics');
    const u = new FormData();
    u.set('label', 'x');
    await expect(mod.updateContactTopic(1, null, u)).rejects.toThrow();
    await expect(mod.deleteContactTopic(1)).rejects.toThrow();
    const b = new FormData();
    b.append('ids', '1');
    await expect(mod.bulkDeleteContactTopics(b)).rejects.toThrow();
  });

  it('delivery-slots: unauth blocks update/delete/bulk', async () => {
    authed = false;
    const mod = await import('@/app/admin/actions/delivery-slots');
    const u = new FormData();
    u.set('label', 'x');
    await expect(mod.updateDeliverySlot(1, null, u)).rejects.toThrow();
    await expect(mod.deleteDeliverySlot(1)).rejects.toThrow();
    await expect(mod.bulkDeleteDeliverySlots(new FormData())).rejects.toThrow();
  });

  it('email-templates: unauth blocks update', async () => {
    authed = false;
    const { updateEmailTemplate } = await import('@/app/admin/actions/email-templates');
    const u = new FormData();
    u.set('name', 'n');
    u.set('subject', 's');
    u.set('bodyHtml', 'b');
    await expect(updateEmailTemplate('x', null, u)).rejects.toThrow();
  });

  it('order-statuses: unauth blocks update', async () => {
    authed = false;
    const { updateOrderStatus } = await import('@/app/admin/actions/order-statuses');
    const u = new FormData();
    u.set('label', 'x');
    u.set('color', 'c');
    await expect(updateOrderStatus('pending', null, u)).rejects.toThrow();
  });
});

// =====================================================================
// categories — CRUD with slug id + FK restrict on delete (via products)
// =====================================================================
describe('categories actions', () => {
  function catForm(values: Partial<Record<'id' | 'name' | 'icon' | 'description' | 'sortOrder', string>>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(values)) fd.set(k, v as string);
    return fd;
  }

  it('blocks unauthenticated create/update/delete/bulk', async () => {
    authed = false;
    const mod = await import('@/app/admin/actions/categories');
    await expect(mod.createCategory(null, catForm({ id: 'x', name: 'x', icon: '🌱', description: 'd' }))).rejects.toThrow();
    await expect(mod.updateCategory('x', null, catForm({ id: 'x', name: 'x', icon: '🌱', description: 'd' }))).rejects.toThrow();
    await expect(mod.deleteCategory('x')).rejects.toThrow();
    const b = new FormData();
    b.append('ids', 'x');
    await expect(mod.bulkDeleteCategories(b)).rejects.toThrow();
  });

  it('rejects invalid slug id', async () => {
    const { createCategory } = await import('@/app/admin/actions/categories');
    const res = await createCategory(null, catForm({ id: 'BAD ID', name: 'x', icon: '🌱', description: 'd' }));
    expect(res?.error).toBeTruthy();
  });

  it('rejects oversize icon (>10)', async () => {
    const { createCategory } = await import('@/app/admin/actions/categories');
    const res = await createCategory(null, catForm({ id: 'leafy', name: 'Rau ăn lá', icon: 'i'.repeat(11), description: 'd' }));
    expect(res?.error).toBeTruthy();
  });

  it('creates, updates, deletes', async () => {
    const { createCategory, updateCategory, deleteCategory } = await import('@/app/admin/actions/categories');
    const { db } = await import('@/db/client');
    const { categories } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createCategory(null, catForm({
      id: 'cat-test-1', name: 'Rau ăn lá', icon: '🥬', description: 'Rau xanh', sortOrder: '1',
    }))).rejects.toThrow();
    const [row] = await db.select().from(categories).where(eq(categories.id, 'cat-test-1'));
    expect(row.name).toBe('Rau ăn lá');
    expect(row.sortOrder).toBe(1);

    await expect(updateCategory('cat-test-1', null, catForm({
      id: 'cat-test-1', name: 'Rau ăn lá mới', icon: '🥗', description: 'mô tả mới', sortOrder: '5',
    }))).rejects.toThrow();
    const [after] = await db.select().from(categories).where(eq(categories.id, 'cat-test-1'));
    expect(after.name).toBe('Rau ăn lá mới');
    expect(after.sortOrder).toBe(5);
    expect(after.updatedAt.getTime()).toBeGreaterThanOrEqual(row.updatedAt.getTime());

    await expect(deleteCategory('cat-test-1')).rejects.toThrow();
    const gone = await db.select().from(categories).where(eq(categories.id, 'cat-test-1'));
    expect(gone).toHaveLength(0);
  });

  it('delete rejects with Vietnamese message when a product references it (FK restrict)', async () => {
    const { db } = await import('@/db/client');
    const { categories, products } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await db.insert(categories).values({ id: 'cat-fk', name: 'C', icon: '🌿', description: 'd' });
    await db.insert(products).values({
      id: 'prod-fk-1', name: 'P', categoryId: 'cat-fk', unit: 'kg', price: 10_000,
      image: '/uploads/x.webp', description: 'pd',
    });

    const { deleteCategory, bulkDeleteCategories } = await import('@/app/admin/actions/categories');
    await expect(deleteCategory('cat-fk')).rejects.toThrow(/sản phẩm sử dụng/);

    const fd = new FormData();
    fd.append('ids', 'cat-fk');
    await expect(bulkDeleteCategories(fd)).rejects.toThrow(/sản phẩm sử dụng/);

    // row still present
    const [still] = await db.select().from(categories).where(eq(categories.id, 'cat-fk'));
    expect(still).toBeDefined();

    // cleanup
    await db.delete(products).where(eq(products.id, 'prod-fk-1'));
    await db.delete(categories).where(eq(categories.id, 'cat-fk'));
  });

  it('bulkDelete filters empty strings', async () => {
    const { bulkDeleteCategories } = await import('@/app/admin/actions/categories');
    const { db } = await import('@/db/client');
    const { categories } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    await db.insert(categories).values([
      { id: 'cat-bulk-a', name: 'A', icon: '🌱', description: 'd' },
      { id: 'cat-bulk-b', name: 'B', icon: '🌱', description: 'd' },
    ]);
    const fd = new FormData();
    fd.append('ids', 'cat-bulk-a');
    fd.append('ids', '');
    fd.append('ids', 'cat-bulk-b');
    await expect(bulkDeleteCategories(fd)).rejects.toThrow();
    const remaining = await db.select().from(categories).where(inArray(categories.id, ['cat-bulk-a', 'cat-bulk-b']));
    expect(remaining).toHaveLength(0);
  });

  it('rejects oversize name (>120) and description (>300)', async () => {
    const { createCategory } = await import('@/app/admin/actions/categories');
    const r1 = await createCategory(null, catForm({
      id: 'cat-big-name', name: 'n'.repeat(121), icon: '🌱', description: 'd',
    }));
    expect(r1?.error).toBeTruthy();

    const r2 = await createCategory(null, catForm({
      id: 'cat-big-desc', name: 'ok', icon: '🌱', description: 'd'.repeat(301),
    }));
    expect(r2?.error).toBeTruthy();
  });
});

// =====================================================================
// faq — simple CRUD
// =====================================================================
describe('faq actions', () => {
  it('blocks unauth across all operations', async () => {
    authed = false;
    const mod = await import('@/app/admin/actions/faq');
    const fd = new FormData();
    fd.set('question', 'q');
    fd.set('answer', 'a');
    await expect(mod.createFaq(null, fd)).rejects.toThrow();
    await expect(mod.updateFaq(1, null, fd)).rejects.toThrow();
    await expect(mod.deleteFaq(1)).rejects.toThrow();
    const b = new FormData();
    b.append('ids', '1');
    await expect(mod.bulkDeleteFaq(b)).rejects.toThrow();
  });

  it('rejects empty question or answer', async () => {
    const { createFaq } = await import('@/app/admin/actions/faq');
    const a = new FormData();
    a.set('question', '');
    a.set('answer', 'a');
    expect((await createFaq(null, a))?.error).toBeTruthy();

    const b = new FormData();
    b.set('question', 'q');
    b.set('answer', '');
    expect((await createFaq(null, b))?.error).toBeTruthy();
  });

  it('rejects oversize question (>300) and answer (>2000)', async () => {
    const { createFaq } = await import('@/app/admin/actions/faq');
    const a = new FormData();
    a.set('question', 'q'.repeat(301));
    a.set('answer', 'a');
    expect((await createFaq(null, a))?.error).toBeTruthy();

    const b = new FormData();
    b.set('question', 'q');
    b.set('answer', 'a'.repeat(2001));
    expect((await createFaq(null, b))?.error).toBeTruthy();
  });

  it('creates, updates, deletes', async () => {
    const { createFaq, updateFaq, deleteFaq } = await import('@/app/admin/actions/faq');
    const { db } = await import('@/db/client');
    const { faqItems } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const fd = new FormData();
    fd.set('question', 'Giao hàng mất bao lâu?');
    fd.set('answer', 'Trong 24h nội thành.');
    fd.set('sortOrder', '7');
    await expect(createFaq(null, fd)).rejects.toThrow();
    const [row] = await db.select().from(faqItems).where(eq(faqItems.question, 'Giao hàng mất bao lâu?'));
    expect(row.answer).toBe('Trong 24h nội thành.');
    expect(row.sortOrder).toBe(7);

    const u = new FormData();
    u.set('question', 'Giao trong bao lâu?');
    u.set('answer', 'Dưới 24h.');
    u.set('sortOrder', '3');
    await expect(updateFaq(row.id, null, u)).rejects.toThrow();
    const [after] = await db.select().from(faqItems).where(eq(faqItems.id, row.id));
    expect(after.question).toBe('Giao trong bao lâu?');
    expect(after.sortOrder).toBe(3);

    await expect(deleteFaq(row.id)).rejects.toThrow();
    const gone = await db.select().from(faqItems).where(eq(faqItems.id, row.id));
    expect(gone).toHaveLength(0);
  });

  it('bulkDelete filters non-numeric and removes', async () => {
    const { bulkDeleteFaq } = await import('@/app/admin/actions/faq');
    const { db } = await import('@/db/client');
    const { faqItems } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    const rows = await db
      .insert(faqItems)
      .values([
        { question: 'Q1', answer: 'A1' },
        { question: 'Q2', answer: 'A2' },
      ])
      .returning();
    const ids = rows.map((r) => r.id);

    const fd = new FormData();
    fd.append('ids', String(ids[0]));
    fd.append('ids', 'bogus');
    fd.append('ids', String(ids[1]));
    await expect(bulkDeleteFaq(fd)).rejects.toThrow();
    const rem = await db.select().from(faqItems).where(inArray(faqItems.id, ids));
    expect(rem).toHaveLength(0);
  });
});

// =====================================================================
// farmers — CRUD with image side-effects (uploads mock tracks calls)
// =====================================================================
describe('farmers actions', () => {
  function farmerForm(v: Partial<Record<
    'id' | 'name' | 'farm' | 'location' | 'years' | 'specialty' | 'avatar' | 'cover' | 'story' | 'certifications',
    string
  >>) {
    const fd = new FormData();
    for (const [k, val] of Object.entries(v)) fd.set(k, val as string);
    return fd;
  }

  const valid = () => ({
    id: 'farmer-t1',
    name: 'Chị Mai',
    farm: 'Nông trại Mai',
    location: 'Đà Lạt',
    years: '10',
    specialty: 'Rau hữu cơ',
    avatar: '/uploads/a.webp',
    cover: '/uploads/b.webp',
    story: 'Một câu chuyện về nông trại xanh.',
    certifications: 'VietGAP, PGS, Organic',
  });

  beforeEach(() => { uploadCalls.length = 0; });

  it('blocks unauth for all operations', async () => {
    authed = false;
    const mod = await import('@/app/admin/actions/farmers');
    await expect(mod.createFarmer(null, farmerForm(valid()))).rejects.toThrow();
    await expect(mod.updateFarmer('x', null, farmerForm(valid()))).rejects.toThrow();
    await expect(mod.deleteFarmer('x')).rejects.toThrow();
    const b = new FormData();
    b.append('ids', 'x');
    await expect(mod.bulkDeleteFarmers(b)).rejects.toThrow();
  });

  it('rejects invalid slug id', async () => {
    const { createFarmer } = await import('@/app/admin/actions/farmers');
    const res = await createFarmer(null, farmerForm({ ...valid(), id: 'BAD ID' }));
    expect(res?.error).toBeTruthy();
  });

  it('rejects years > 100 and years < 0', async () => {
    const { createFarmer } = await import('@/app/admin/actions/farmers');
    const r1 = await createFarmer(null, farmerForm({ ...valid(), id: 'f-age-hi', years: '101' }));
    expect(r1?.error).toBeTruthy();
    const r2 = await createFarmer(null, farmerForm({ ...valid(), id: 'f-age-lo', years: '-1' }));
    expect(r2?.error).toBeTruthy();
  });

  it('creates, updates (triggers deleteUploadIfReplaced x2), deletes (triggers deleteUpload x2)', async () => {
    const { createFarmer, updateFarmer, deleteFarmer } = await import('@/app/admin/actions/farmers');
    const { db } = await import('@/db/client');
    const { farmers } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createFarmer(null, farmerForm(valid()))).rejects.toThrow();
    const [row] = await db.select().from(farmers).where(eq(farmers.id, 'farmer-t1'));
    expect(row.certifications).toEqual(['VietGAP', 'PGS', 'Organic']);
    expect(row.years).toBe(10);

    uploadCalls.length = 0;
    await expect(updateFarmer('farmer-t1', null, farmerForm({
      ...valid(),
      id: 'farmer-t1',
      avatar: '/uploads/a2.webp', // new avatar
      cover: '/uploads/b.webp',   // unchanged cover
      years: '11',
    }))).rejects.toThrow();

    const replaced = uploadCalls.filter((c) => c.fn === 'deleteUploadIfReplaced');
    expect(replaced).toHaveLength(2);
    expect(replaced[0].args).toEqual(['/uploads/a.webp', '/uploads/a2.webp']);
    expect(replaced[1].args).toEqual(['/uploads/b.webp', '/uploads/b.webp']);

    uploadCalls.length = 0;
    await expect(deleteFarmer('farmer-t1')).rejects.toThrow();
    const dels = uploadCalls.filter((c) => c.fn === 'deleteUpload');
    expect(dels).toHaveLength(2);
    expect(new Set(dels.flatMap((c) => c.args))).toEqual(new Set(['/uploads/a2.webp', '/uploads/b.webp']));

    const gone = await db.select().from(farmers).where(eq(farmers.id, 'farmer-t1'));
    expect(gone).toHaveLength(0);
  });

  it('empty certifications string → empty array', async () => {
    const { createFarmer } = await import('@/app/admin/actions/farmers');
    const { db } = await import('@/db/client');
    const { farmers } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createFarmer(null, farmerForm({ ...valid(), id: 'f-nocert', certifications: '' }))).rejects.toThrow();
    const [row] = await db.select().from(farmers).where(eq(farmers.id, 'f-nocert'));
    expect(row.certifications).toEqual([]);
  });

  it('certifications split trims whitespace and drops empty items', async () => {
    const { createFarmer } = await import('@/app/admin/actions/farmers');
    const { db } = await import('@/db/client');
    const { farmers } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createFarmer(null, farmerForm({
      ...valid(), id: 'f-certs', certifications: '  VietGAP  , ,PGS,   Organic  ,',
    }))).rejects.toThrow();
    const [row] = await db.select().from(farmers).where(eq(farmers.id, 'f-certs'));
    expect(row.certifications).toEqual(['VietGAP', 'PGS', 'Organic']);
  });

  it('bulkDelete removes all and triggers deleteUpload per avatar/cover pair', async () => {
    const { bulkDeleteFarmers } = await import('@/app/admin/actions/farmers');
    const { db } = await import('@/db/client');
    const { farmers } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    await db.insert(farmers).values([
      { id: 'f-bulk-1', name: 'N', farm: 'F', location: 'L', years: 1, specialty: 's', avatar: '/u/a1', cover: '/u/b1', story: 's' },
      { id: 'f-bulk-2', name: 'N', farm: 'F', location: 'L', years: 1, specialty: 's', avatar: '/u/a2', cover: '/u/b2', story: 's' },
    ]);

    uploadCalls.length = 0;
    const fd = new FormData();
    fd.append('ids', 'f-bulk-1');
    fd.append('ids', 'f-bulk-2');
    await expect(bulkDeleteFarmers(fd)).rejects.toThrow();
    const urls = uploadCalls.filter((c) => c.fn === 'deleteUpload').flatMap((c) => c.args);
    expect(new Set(urls)).toEqual(new Set(['/u/a1', '/u/b1', '/u/a2', '/u/b2']));

    const remaining = await db.select().from(farmers).where(inArray(farmers.id, ['f-bulk-1', 'f-bulk-2']));
    expect(remaining).toHaveLength(0);
  });

  it('delete of non-existent id → no upload calls, still redirects', async () => {
    const { deleteFarmer } = await import('@/app/admin/actions/farmers');
    uploadCalls.length = 0;
    await expect(deleteFarmer('f-ghost')).rejects.toThrow();
    expect(uploadCalls).toHaveLength(0);
  });
});

// =====================================================================
// testimonials — CRUD with avatar upload side-effects
// =====================================================================
describe('testimonials actions', () => {
  const valid = () => ({
    name: 'Chị An',
    role: 'Khách hàng',
    avatar: '/uploads/t1.webp',
    content: 'Rau rất tươi và sạch.',
    sortOrder: '0',
  });

  function tForm(v: Partial<Record<'name' | 'role' | 'avatar' | 'content' | 'sortOrder', string>>) {
    const fd = new FormData();
    for (const [k, val] of Object.entries(v)) fd.set(k, val as string);
    return fd;
  }

  beforeEach(() => { uploadCalls.length = 0; });

  it('blocks unauth', async () => {
    authed = false;
    const mod = await import('@/app/admin/actions/testimonials');
    await expect(mod.createTestimonial(null, tForm(valid()))).rejects.toThrow();
    await expect(mod.updateTestimonial(1, null, tForm(valid()))).rejects.toThrow();
    await expect(mod.deleteTestimonial(1)).rejects.toThrow();
    await expect(mod.bulkDeleteTestimonials(new FormData())).rejects.toThrow();
  });

  it('rejects empty name / role / content', async () => {
    const { createTestimonial } = await import('@/app/admin/actions/testimonials');
    expect((await createTestimonial(null, tForm({ ...valid(), name: '' })))?.error).toBeTruthy();
    expect((await createTestimonial(null, tForm({ ...valid(), role: '' })))?.error).toBeTruthy();
    expect((await createTestimonial(null, tForm({ ...valid(), content: '' })))?.error).toBeTruthy();
  });

  it('rejects oversize content (>1000)', async () => {
    const { createTestimonial } = await import('@/app/admin/actions/testimonials');
    const res = await createTestimonial(null, tForm({ ...valid(), content: 'c'.repeat(1001) }));
    expect(res?.error).toBeTruthy();
  });

  it('creates, updates (triggers deleteUploadIfReplaced), deletes (triggers deleteUpload)', async () => {
    const { createTestimonial, updateTestimonial, deleteTestimonial } =
      await import('@/app/admin/actions/testimonials');
    const { db } = await import('@/db/client');
    const { testimonials } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createTestimonial(null, tForm(valid()))).rejects.toThrow();
    const [row] = await db.select().from(testimonials).where(eq(testimonials.name, 'Chị An'));
    expect(row.content).toBe('Rau rất tươi và sạch.');

    uploadCalls.length = 0;
    await expect(updateTestimonial(row.id, null, tForm({ ...valid(), avatar: '/uploads/t2.webp' }))).rejects.toThrow();
    const repl = uploadCalls.filter((c) => c.fn === 'deleteUploadIfReplaced');
    expect(repl).toHaveLength(1);
    expect(repl[0].args).toEqual(['/uploads/t1.webp', '/uploads/t2.webp']);

    uploadCalls.length = 0;
    await expect(deleteTestimonial(row.id)).rejects.toThrow();
    expect(uploadCalls.filter((c) => c.fn === 'deleteUpload')[0]?.args).toEqual(['/uploads/t2.webp']);

    const gone = await db.select().from(testimonials).where(eq(testimonials.id, row.id));
    expect(gone).toHaveLength(0);
  });

  it('bulkDelete removes and calls deleteUpload per avatar', async () => {
    const { bulkDeleteTestimonials } = await import('@/app/admin/actions/testimonials');
    const { db } = await import('@/db/client');
    const { testimonials } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');

    const rows = await db.insert(testimonials).values([
      { name: 'T1', role: 'r', avatar: '/u/tt1', content: 'c' },
      { name: 'T2', role: 'r', avatar: '/u/tt2', content: 'c' },
    ]).returning();
    const ids = rows.map((r) => r.id);

    uploadCalls.length = 0;
    const fd = new FormData();
    ids.forEach((id) => fd.append('ids', String(id)));
    await expect(bulkDeleteTestimonials(fd)).rejects.toThrow();
    const urls = uploadCalls.filter((c) => c.fn === 'deleteUpload').flatMap((c) => c.args);
    expect(new Set(urls)).toEqual(new Set(['/u/tt1', '/u/tt2']));
    const rem = await db.select().from(testimonials).where(inArray(testimonials.id, ids));
    expect(rem).toHaveLength(0);
  });
});
