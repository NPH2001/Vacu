'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { menuItems } from '@/db/schema';
import { menuItemSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type MenuItemFormState = { error?: string } | null;

function parse(fd: FormData) {
  return menuItemSchema.safeParse({
    location: fd.get('location'),
    label: fd.get('label'),
    href: fd.get('href'),
    openInNewTab: fd.get('openInNewTab') === 'on' || fd.get('openInNewTab') === '1',
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createMenuItem(_p: MenuItemFormState, fd: FormData): Promise<MenuItemFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.insert(menuItems).values(r.data);
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/menu');
  revalidatePath('/', 'layout');
  redirect('/admin/menu');
}

export async function updateMenuItem(id: number, _p: MenuItemFormState, fd: FormData): Promise<MenuItemFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(menuItems).set(r.data).where(eq(menuItems.id, id));
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/menu');
  revalidatePath('/', 'layout');
  redirect('/admin/menu');
}

export async function deleteMenuItem(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(menuItems).where(eq(menuItems.id, id));
  revalidatePath('/admin/menu');
  revalidatePath('/', 'layout');
  redirect('/admin/menu');
}

export async function bulkDeleteMenuItems(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) redirect('/admin/menu');
  await db.delete(menuItems).where(inArray(menuItems.id, ids));
  revalidatePath('/admin/menu');
  revalidatePath('/', 'layout');
  redirect('/admin/menu');
}
