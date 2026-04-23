'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { orderStatuses } from '@/db/schema';
import { orderStatusRowSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type OrderStatusFormState = { error?: string } | null;

export async function updateOrderStatus(
  key: string,
  _p: OrderStatusFormState,
  fd: FormData,
): Promise<OrderStatusFormState> {
  await requireAdmin();
  const r = orderStatusRowSchema.safeParse({
    label: fd.get('label'),
    color: fd.get('color'),
    sortOrder: fd.get('sortOrder') || 0,
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(orderStatuses).set(r.data).where(eq(orderStatuses.key, key));
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/order-statuses');
  revalidatePath('/admin/orders');
  revalidatePath('/orders');
  redirect('/admin/order-statuses');
}
