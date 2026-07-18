'use server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders, orderItems, siteInfo, products, deliverySlots } from '@/db/schema';
import { placeOrderSchema } from '@/lib/validators';
import {
  MY_ORDERS_COOKIE, MY_ORDERS_MAX_AGE,
  appendMyOrder, parseMyOrders,
} from '@/lib/orders-cookie';
import { formatPrice } from '@/lib/format';
import { sendTemplatedMail } from '@/lib/mail';
import { vietQrImageUrl, findBank } from '@/lib/banks';
import { isUniqueViolation } from '@/lib/db-errors';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// The client is trusted for the product id and quantity only — never the price,
// name or unit. Everything money-related is rebuilt from the products table.
const cartLineSchema = z.object({
  id: z.string().min(1).max(80),
  qty: z.coerce.number().int().positive().max(99),
});

type BuiltLine = { productId: string; name: string; price: number; qty: number; unit: string; image: string };

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

/** A collision-resistant, human-readable order id. */
function newOrderId(): string {
  return `NTX-${globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

/** Security-sensitive links use the configured canonical site URL, never the
 *  request Host header (which an attacker controls). */
function siteOrigin(url: string): string {
  try {
    return url.trim() ? new URL(url.trim()).origin : '';
  } catch {
    return '';
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c),
  );
}

export async function placeOrder(formData: FormData): Promise<PlaceOrderResult> {
  const meta = placeOrderSchema.safeParse({
    customerName: formData.get('customerName'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    deliverySlot: formData.get('deliverySlot'),
    note: formData.get('note') || undefined,
    paymentMethod: formData.get('paymentMethod') || 'cod',
    customerEmail: formData.get('customerEmail') || undefined,
  });
  if (!meta.success) return { ok: false, error: 'Thông tin không hợp lệ' };

  // Idempotency: a retried submit with the same key returns the existing order.
  const idempotencyKey = String(formData.get('idempotencyKey') ?? '').slice(0, 100) || null;
  if (idempotencyKey) {
    const [existing] = await db.select({ id: orders.id }).from(orders)
      .where(eq(orders.idempotencyKey, idempotencyKey)).limit(1);
    if (existing) return { ok: true, orderId: existing.id };
  }

  // Unauthenticated, and each success writes rows + sends two emails. The
  // idempotency key dedupes honest retries above; this throttles a distinct-key
  // loop that would otherwise spam orders and admin notifications. Placed after
  // the idempotency short-circuit so a genuine retry never counts against it.
  if (!rateLimit(`order:ip:${await clientIp()}`, { limit: 10, windowMs: 10 * 60_000 }).ok) {
    return { ok: false, error: 'Bạn đặt hàng quá nhiều lần. Vui lòng thử lại sau ít phút.' };
  }

  let requested: z.infer<typeof cartLineSchema>[];
  try {
    requested = z.array(cartLineSchema).min(1).max(100).parse(JSON.parse(String(formData.get('cart'))));
  } catch {
    return { ok: false, error: 'Giỏ hàng trống hoặc không hợp lệ' };
  }

  // Rebuild every line from the database — prices, names and stock are never
  // trusted from the client.
  const ids = [...new Set(requested.map((l) => l.id))];
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const byId = new Map(rows.map((p) => [p.id, p]));

  const lines: BuiltLine[] = [];
  for (const { id, qty } of requested) {
    const p = byId.get(id);
    if (!p) return { ok: false, error: 'Một sản phẩm trong giỏ không còn tồn tại. Vui lòng kiểm tra lại giỏ hàng.' };
    if (!p.inStock) return { ok: false, error: `“${p.name}” hiện đã hết hàng. Vui lòng bỏ khỏi giỏ rồi thử lại.` };
    lines.push({ productId: p.id, name: p.name, price: p.price, qty, unit: p.unit, image: p.image });
  }
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  // orders.total is a 4-byte integer; refuse an order that would overflow it
  // rather than throwing an opaque DB error.
  if (total > 2_147_483_647) {
    return { ok: false, error: 'Đơn hàng quá lớn, vui lòng tách thành nhiều đơn nhỏ hơn.' };
  }

  // Validate the delivery slot against the currently active ones.
  const activeSlots = await db.select({ label: deliverySlots.label }).from(deliverySlots)
    .where(eq(deliverySlots.active, true));
  if (activeSlots.length > 0 && !activeSlots.some((s) => s.label === meta.data.deliverySlot)) {
    return { ok: false, error: 'Khung giờ giao không hợp lệ. Vui lòng chọn lại.' };
  }

  // Bank transfer must be enabled server-side, else fall back to COD so the
  // customer is never left without a payment path.
  const [info] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  const paymentMethod = meta.data.paymentMethod === 'bank' && info?.bankEnabled ? 'bank' : 'cod';

  const { customerEmail, ...rest } = meta.data;
  const orderId = newOrderId();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        // `...rest` first so the explicit, server-validated paymentMethod wins
        // over the un-coerced one from the form.
        ...rest,
        id: orderId, total, paymentMethod,
        customerEmail: customerEmail ?? null,
        idempotencyKey,
      });
      await tx.insert(orderItems).values(lines.map((l) => ({ orderId, ...l })));
    });
  } catch (e) {
    // A racing double-submit hits the idempotency_key unique constraint (the
    // aborted-transaction error propagates as the original 23505). Recover to the
    // already-placed order instead of showing a failure.
    if (isUniqueViolation(e) && idempotencyKey) {
      const [existing] = await db.select({ id: orders.id }).from(orders)
        .where(eq(orders.idempotencyKey, idempotencyKey)).limit(1);
      if (existing) return { ok: true, orderId: existing.id };
    }
    console.error('[placeOrder] insert error:', e);
    return { ok: false, error: 'Không đặt được đơn, vui lòng thử lại.' };
  }

  try {
    const store = await cookies();
    const existing = parseMyOrders(store.get(MY_ORDERS_COOKIE)?.value);
    store.set(MY_ORDERS_COOKIE, JSON.stringify(appendMyOrder(existing, orderId)), {
      httpOnly: false, path: '/', sameSite: 'lax', maxAge: MY_ORDERS_MAX_AGE,
    });
  } catch {
    // No request context (e.g., unit test): skip cookie
  }

  // Fire-and-notify emails (don't block success if SMTP fails)
  void sendOrderEmails({ orderId, total, meta: { ...meta.data, paymentMethod } })
    .catch((e) => console.error('[placeOrder] email error:', e));

  return { ok: true, orderId };
}

async function sendOrderEmails({
  orderId, total, meta,
}: {
  orderId: string;
  total: number;
  meta: z.infer<typeof placeOrderSchema>;
}) {
  const [info] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  if (!info || !info.smtpEnabled) return;

  const origin = siteOrigin(info.siteUrl);
  const paymentMethodLabel = meta.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 'Tiền mặt khi nhận (COD)';

  let paymentInfoHtml = '';
  if (meta.paymentMethod === 'bank' && info.bankEnabled && info.bankBin && info.bankAccountNumber) {
    const qrNote = `Thanh toan ${orderId}`;
    const qrUrl = vietQrImageUrl({
      bin: info.bankBin,
      accountNumber: info.bankAccountNumber,
      accountHolder: info.bankAccountHolder,
      amount: total,
      note: qrNote,
    });
    const bank = findBank(info.bankBin);
    const bankDisplay = info.bankName || bank?.name || 'Ngân hàng';
    paymentInfoHtml = `
      <div style="margin:16px 0;padding:16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:12px">
        <p style="margin:0 0 8px 0;font-weight:600;color:#92400e">Quét QR để chuyển khoản:</p>
        <img src="${esc(qrUrl)}" alt="QR ${esc(orderId)}" style="max-width:260px;display:block;margin:8px 0" />
        <table style="width:100%;font-size:14px;margin-top:8px">
          <tr><td style="color:#666">Ngân hàng</td><td style="text-align:right">${esc(bankDisplay)}</td></tr>
          <tr><td style="color:#666">Số tài khoản</td><td style="text-align:right;font-family:monospace">${esc(info.bankAccountNumber)}</td></tr>
          <tr><td style="color:#666">Chủ tài khoản</td><td style="text-align:right">${esc(info.bankAccountHolder)}</td></tr>
          <tr><td style="color:#666">Số tiền</td><td style="text-align:right;font-weight:700">${esc(formatPrice(total))}</td></tr>
          <tr><td style="color:#666">Nội dung</td><td style="text-align:right;font-family:monospace;font-weight:700">${esc(qrNote)}</td></tr>
        </table>
      </div>
    `;
  }

  const commonVars = {
    siteName: info.name,
    siteEmail: info.email,
    sitePhone: info.phone,
    orderId,
    orderTotal: formatPrice(total),
    customerName: meta.customerName,
    customerPhone: meta.phone,
    customerEmail: meta.customerEmail ?? '',
    address: meta.address,
    deliverySlot: meta.deliverySlot,
    note: meta.note ?? '',
    paymentMethod: paymentMethodLabel,
  };

  // Customer email
  if (meta.customerEmail) {
    await sendTemplatedMail(
      'order_confirm_customer',
      meta.customerEmail,
      { ...commonVars, paymentInfoHtml },
      ['paymentInfoHtml'],
    );
  }

  // Admin notify
  await sendTemplatedMail(
    'order_notify_admin',
    info.email,
    { ...commonVars, adminOrderLink: `${origin}/admin/orders/${orderId}` },
    [],
    meta.customerEmail || undefined,
  );
}
