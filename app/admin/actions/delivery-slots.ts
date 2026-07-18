'use server';
import { redirect } from 'next/navigation';
import { friendlyWriteError } from '@/lib/db-errors';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { deliverySlots } from '@/db/schema';
import { deliverySlotSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type DeliverySlotFormState = { error?: string } | null;

function parse(fd: FormData) {
  return deliverySlotSchema.safeParse({
    label: fd.get('label'),
    active: fd.get('active') ? true : false,
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createDeliverySlot(_p: DeliverySlotFormState, fd: FormData): Promise<DeliverySlotFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.insert(deliverySlots).values(r.data);
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/delivery-slots');
  revalidatePath('/checkout');
  redirect('/admin/delivery-slots');
}

export async function updateDeliverySlot(id: number, _p: DeliverySlotFormState, fd: FormData): Promise<DeliverySlotFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(deliverySlots).set(r.data).where(eq(deliverySlots.id, id));
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/delivery-slots');
  revalidatePath('/checkout');
  redirect('/admin/delivery-slots');
}

export async function deleteDeliverySlot(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(deliverySlots).where(eq(deliverySlots.id, id));
  revalidatePath('/admin/delivery-slots');
  revalidatePath('/checkout');
  redirect('/admin/delivery-slots');
}

export async function bulkDeleteDeliverySlots(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) redirect('/admin/delivery-slots');
  await db.delete(deliverySlots).where(inArray(deliverySlots.id, ids));
  revalidatePath('/admin/delivery-slots');
  revalidatePath('/checkout');
  redirect('/admin/delivery-slots');
}
