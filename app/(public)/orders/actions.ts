'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import {
  MY_ORDERS_COOKIE, MY_ORDERS_MAX_AGE, appendMyOrder, parseMyOrders,
} from '@/lib/orders-cookie';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export type LookupState = { error?: string } | null;

/** Digits only, so "0912 345 678" and "0912345678" compare equal. */
function normalizePhone(v: string): string {
  return v.replace(/\D/g, '');
}

/**
 * Guest order lookup: order code + the phone on the order. The code (~32 bits)
 * is the bearer secret; the phone is a second factor that makes enumeration
 * impractical. On a match the order id is added to the caller's cookie so it
 * appears in "Đơn hàng của tôi" — the point is to recover an order after the
 * cookie is lost or on a different device. Both "no such code" and "wrong phone"
 * return the SAME generic message (no oracle), and it's rate-limited per IP.
 */
export async function lookupOrder(_prev: LookupState, fd: FormData): Promise<LookupState> {
  const code = String(fd.get('orderCode') ?? '').trim().toUpperCase();
  const phone = normalizePhone(String(fd.get('phone') ?? ''));
  if (!code || phone.length < 6) {
    return { error: 'Nhập mã đơn và số điện thoại đã đặt.' };
  }

  if (!rateLimit(`order-lookup:ip:${await clientIp()}`, { limit: 10, windowMs: 10 * 60_000 }).ok) {
    return { error: 'Bạn thử quá nhiều lần. Vui lòng thử lại sau ít phút.' };
  }

  const generic = { error: 'Không tìm thấy đơn hàng khớp mã và số điện thoại này.' };
  const [order] = await db.select({ id: orders.id, phone: orders.phone })
    .from(orders).where(eq(orders.id, code)).limit(1);
  // Constant-ish: we look up by id then compare the phone in code; a missing
  // order and a phone mismatch are indistinguishable to the caller.
  if (!order || normalizePhone(order.phone) !== phone) return generic;

  const store = await cookies();
  const existing = parseMyOrders(store.get(MY_ORDERS_COOKIE)?.value);
  store.set(MY_ORDERS_COOKIE, JSON.stringify(appendMyOrder(existing, order.id)), {
    httpOnly: false, sameSite: 'lax', path: '/', maxAge: MY_ORDERS_MAX_AGE,
  });
  // The recovered order now appears in the list below — that's the confirmation.
  redirect('/orders');
}
