'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import { categorySchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { getDescendantIds } from '@/lib/categories';

export type CategoryFormState = { error?: string } | null;

type PgErr = { message?: string; code?: string; cause?: { message?: string; code?: string } };

function isFkViolation(e: unknown): boolean {
  const err = e as PgErr;
  if (err.code === '23503' || err.cause?.code === '23503') return true;
  const msg = `${err.message ?? ''} ${err.cause?.message ?? ''}`;
  return /violates foreign key|restrict/i.test(msg);
}

function isUniqueViolation(e: unknown): boolean {
  const err = e as PgErr;
  if (err.code === '23505' || err.cause?.code === '23505') return true;
  const msg = `${err.message ?? ''} ${err.cause?.message ?? ''}`;
  return /duplicate key|unique constraint/i.test(msg);
}

function friendlyWriteError(e: unknown): string {
  if (isUniqueViolation(e)) return 'Slug đã tồn tại — chọn slug khác.';
  if (isFkViolation(e)) return 'Danh mục cha không tồn tại.';
  return (e as Error).message;
}

function parse(fd: FormData) {
  return categorySchema.safeParse({
    id: fd.get('id'),
    parentId: fd.get('parentId'),
    name: fd.get('name'),
    icon: fd.get('icon'),
    description: fd.get('description'),
    sortOrder: fd.get('sortOrder') || 0,
  });
}

async function checkCycle(id: string, parentId: string | null): Promise<string | null> {
  if (!parentId) return null;
  if (parentId === id) return 'Không thể chọn chính nó làm cha';
  const allRows = await db.select().from(categories);
  const descendants = getDescendantIds(id, allRows);
  if (descendants.includes(parentId)) return 'Không thể chọn danh mục con làm cha';
  return null;
}

export async function createCategory(_prev: CategoryFormState, fd: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const cycleErr = await checkCycle(r.data.id, r.data.parentId);
  if (cycleErr) return { error: cycleErr };

  // Pre-check: slug uniqueness + parent existence — friendlier than raw FK/PK errors.
  const [existing, parent] = await Promise.all([
    db.select({ id: categories.id, name: categories.name })
      .from(categories).where(eq(categories.id, r.data.id)).limit(1),
    r.data.parentId
      ? db.select({ id: categories.id }).from(categories)
          .where(eq(categories.id, r.data.parentId)).limit(1)
      : Promise.resolve([]),
  ]);
  if (existing[0]) {
    return { error: `Slug "${r.data.id}" đã có danh mục "${existing[0].name}" dùng — chọn slug khác.` };
  }
  if (r.data.parentId && !parent[0]) {
    return { error: `Danh mục cha "${r.data.parentId}" không tồn tại.` };
  }

  try { await db.insert(categories).values(r.data); }
  catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function updateCategory(originalId: string, _prev: CategoryFormState, fd: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const cycleErr = await checkCycle(originalId, r.data.parentId);
  if (cycleErr) return { error: cycleErr };

  if (r.data.parentId) {
    const parent = await db
      .select({ id: categories.id })
      .from(categories).where(eq(categories.id, r.data.parentId)).limit(1);
    if (!parent[0]) {
      return { error: `Danh mục cha "${r.data.parentId}" không tồn tại.` };
    }
  }

  try {
    await db.update(categories).set({ ...r.data, updatedAt: new Date() }).where(eq(categories.id, originalId));
  } catch (e) {
    return { error: friendlyWriteError(e) };
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}

export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (e) {
    if (isFkViolation(e)) throw new Error('Không thể xóa: danh mục đang được sản phẩm sử dụng hoặc có danh mục con.');
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
    if (isFkViolation(e)) throw new Error('Không thể xóa: có danh mục đang được sản phẩm sử dụng hoặc có danh mục con.');
    throw e;
  }
  revalidatePath('/admin/categories');
  redirect('/admin/categories');
}
