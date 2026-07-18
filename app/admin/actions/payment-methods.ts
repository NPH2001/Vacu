'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { paymentMethods } from '@/db/schema';
import { paymentMethodSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type PaymentMethodFormState = { error?: string } | null;

function parseFor(fd: FormData, requireId: boolean) {
  const schema = requireId ? paymentMethodSchema : paymentMethodSchema.omit({ id: true });
  return schema.safeParse({
    ...(requireId ? { id: fd.get('id') } : {}),
    label: fd.get('label'),
    hint: fd.get('hint') ?? '',
    active: fd.get('active') ? true : false,
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createPaymentMethod(_p: PaymentMethodFormState, fd: FormData): Promise<PaymentMethodFormState> {
  await requireAdmin();
  const r = parseFor(fd, true);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.insert(paymentMethods).values(r.data as { id: string; label: string; hint: string; active: boolean; sortOrder: number });
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/payment-methods');
  revalidatePath('/checkout');
  redirect('/admin/payment-methods');
}

export async function updatePaymentMethod(id: string, _p: PaymentMethodFormState, fd: FormData): Promise<PaymentMethodFormState> {
  await requireAdmin();
  const r = parseFor(fd, false);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(paymentMethods).set(r.data).where(eq(paymentMethods.id, id));
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/payment-methods');
  revalidatePath('/checkout');
  redirect('/admin/payment-methods');
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  revalidatePath('/admin/payment-methods');
  revalidatePath('/checkout');
  redirect('/admin/payment-methods');
}

export async function bulkDeletePaymentMethods(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => String(v)).filter((s) => s.length > 0);
  if (ids.length === 0) redirect('/admin/payment-methods');
  await db.delete(paymentMethods).where(inArray(paymentMethods.id, ids));
  revalidatePath('/admin/payment-methods');
  revalidatePath('/checkout');
  redirect('/admin/payment-methods');
}
