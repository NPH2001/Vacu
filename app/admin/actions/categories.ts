'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import { categorySchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type CategoryFormState = { error?: string } | null;

function parse(fd: FormData) {
  return categorySchema.safeParse({
    id: fd.get('id'),
    name: fd.get('name'),
    icon: fd.get('icon'),
    description: fd.get('description'),
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createCategory(_prev: CategoryFormState, fd: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try { await db.insert(categories).values(r.data); }
  catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function updateCategory(originalId: string, _prev: CategoryFormState, fd: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(categories).set({ ...r.data, updatedAt: new Date() }).where(eq(categories.id, originalId));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (e) {
    const msg = (e as Error).message;
    if (/violates foreign key|restrict/i.test(msg)) {
      throw new Error('Không thể xóa: danh mục đang được sản phẩm sử dụng.');
    }
    throw e;
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function bulkDeleteCategories(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) { redirect('/admin/categories'); }
  try {
    await db.delete(categories).where(inArray(categories.id, ids));
  } catch (e) {
    const msg = (e as Error).message;
    if (/violates foreign key|restrict/i.test(msg)) {
      throw new Error('Không thể xóa: có danh mục đang được sản phẩm sử dụng.');
    }
    throw e;
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}
