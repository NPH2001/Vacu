'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { valueProps } from '@/db/schema';
import { valuePropSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type ValuePropFormState = { error?: string } | null;

function parse(fd: FormData) {
  return valuePropSchema.safeParse({
    icon: fd.get('icon'),
    title: fd.get('title'),
    description: fd.get('description'),
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createValueProp(_p: ValuePropFormState, fd: FormData): Promise<ValuePropFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.insert(valueProps).values(r.data);
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/value-props');
  revalidatePath('/', 'layout');
  redirect('/admin/value-props');
}

export async function updateValueProp(id: number, _p: ValuePropFormState, fd: FormData): Promise<ValuePropFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(valueProps).set(r.data).where(eq(valueProps.id, id));
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/value-props');
  revalidatePath('/', 'layout');
  redirect('/admin/value-props');
}

export async function deleteValueProp(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(valueProps).where(eq(valueProps.id, id));
  revalidatePath('/admin/value-props');
  revalidatePath('/', 'layout');
  redirect('/admin/value-props');
}

export async function bulkDeleteValueProps(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) redirect('/admin/value-props');
  await db.delete(valueProps).where(inArray(valueProps.id, ids));
  revalidatePath('/admin/value-props');
  revalidatePath('/', 'layout');
  redirect('/admin/value-props');
}
