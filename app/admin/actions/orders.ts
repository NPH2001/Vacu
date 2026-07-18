'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, and, inArray } from 'drizzle-orm';
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
  await db.update(orders).set({ paymentStatus: 'paid', updatedAt: new Date() }).where(eq(orders.id, id));
  // The customer's order page promises the order auto-advances once paid; move a
  // still-pending order to "preparing" (never regress a later status).
  await db.update(orders).set({ status: 'preparing', updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.status, 'pending')));
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath('/orders');

  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const [info] = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
    if (order?.customerEmail && info?.smtpEnabled) {
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
