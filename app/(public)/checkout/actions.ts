'use server';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders, orderItems, siteInfo } from '@/db/schema';
import { placeOrderSchema } from '@/lib/validators';
import {
  MY_ORDERS_COOKIE, MY_ORDERS_MAX_AGE,
  appendMyOrder, parseMyOrders,
} from '@/lib/orders-cookie';
import { formatPrice } from '@/lib/format';
import { sendTemplatedMail } from '@/lib/mail';
import { vietQrImageUrl, findBank } from '@/lib/banks';

const cartLineSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number().int().positive(),
  qty: z.coerce.number().int().positive(),
  unit: z.string(),
  image: z.string(),
});

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

function newOrderId(): string {
  return `NTX-${Date.now().toString().slice(-8)}`;
}

async function currentOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  const host = h.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
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

  let cart: z.infer<typeof cartLineSchema>[];
  try {
    const raw = formData.get('cart');
    cart = z.array(cartLineSchema).min(1).parse(JSON.parse(String(raw)));
  } catch {
    return { ok: false, error: 'Giỏ hàng trống hoặc không hợp lệ' };
  }

  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const orderId = newOrderId();
  const { customerEmail, ...rest } = meta.data;

  await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      id: orderId, total,
      customerEmail: customerEmail ?? null,
      ...rest,
    });
    await tx.insert(orderItems).values(
      cart.map((l) => ({
        orderId, productId: l.id, name: l.name, price: l.price,
        qty: l.qty, unit: l.unit, image: l.image,
      })),
    );
  });

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
  void sendOrderEmails({
    orderId,
    total,
    meta: meta.data,
  }).catch((e) => console.error('[placeOrder] email error:', e));

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

  const origin = await currentOrigin();
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
