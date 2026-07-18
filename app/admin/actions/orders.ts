'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, ne, inArray, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders, siteInfo } from '@/db/schema';
import { orderStatusSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { sendTemplatedMail } from '@/lib/mail';
import { formatPrice } from '@/lib/format';

export async function updateOrderStatus(id: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const parsed = orderStatusSchema.safeParse(fd.get('status'));
  if (!parsed.success) throw new Error('Trạng thái không hợp lệ');
  await db.update(orders).set({ status: parsed.data, updatedAt: new Date() }).where(eq(orders.id, id));
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
}

export async function markOrderPaid(id: string): Promise<void> {
  await requireAdmin();
  // One atomic guarded UPDATE, not select-then-update: the WHERE excludes
  // already-paid and cancelled orders, and the status advance is a live CASE on
  // the row rather than a value read into JS earlier. This is what makes it
  // correct under concurrency — two simultaneous clicks (or a "mark paid" racing
  // an order-status change) can't both pass the guard and send two confirmation
  // emails, and it can never regress a status the other write just advanced.
  // Under READ COMMITTED the losing UPDATE re-checks the WHERE against the
  // just-committed row, matches nothing, and RETURNING comes back empty.
  const [order] = await db.update(orders).set({
    paymentStatus: 'paid',
    // The order page promises it auto-advances once paid; move a still-pending
    // order to "preparing" and leave any later status untouched.
    status: sql`CASE WHEN ${orders.status} = 'pending' THEN 'preparing' ELSE ${orders.status} END`,
    updatedAt: new Date(),
  }).where(and(
    eq(orders.id, id),
    ne(orders.paymentStatus, 'paid'),
    ne(orders.status, 'cancelled'),
  )).returning();

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/orders');

  // Empty RETURNING = already paid / cancelled / gone → nothing transitioned, so
  // no email. This is the once-only guarantee, now enforced by the DB.
  if (!order) return;

  try {
    const [info] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
    if (order.customerEmail && info?.smtpEnabled) {
      await sendTemplatedMail('payment_confirmed', order.customerEmail, {
        siteName: info.name,
        customerName: order.customerName,
        orderId: order.id,
        orderTotal: formatPrice(order.total),
      });
    }
  } catch (e) {
    console.error('[markOrderPaid] email error:', e);
  }
}

export async function markOrderUnpaid(id: string): Promise<void> {
  await requireAdmin();
  await db.update(orders).set({ paymentStatus: 'unpaid', updatedAt: new Date() }).where(eq(orders.id, id));
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/orders');
}

export async function deleteOrder(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(orders).where(eq(orders.id, id));
  revalidatePath('/admin/orders');
  redirect('/admin/orders');
}

export async function bulkDeleteOrders(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) { redirect('/admin/orders'); }
  await db.delete(orders).where(inArray(orders.id, ids));
  revalidatePath('/admin/orders');
  redirect('/admin/orders');
}
