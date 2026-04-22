'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import { orderStatusSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export async function updateOrderStatus(id: string, fd: FormData): Promise<void> {
  await requireAdmin();
  const parsed = orderStatusSchema.safeParse(fd.get('status'));
  if (!parsed.success) throw new Error('Trạng thái không hợp lệ');
  await db.update(orders).set({ status: parsed.data, updatedAt: new Date() }).where(eq(orders.id, id));
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${id}`);
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
