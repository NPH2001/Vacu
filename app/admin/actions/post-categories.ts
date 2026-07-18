'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { postCategories } from '@/db/schema';
import { postCategorySchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { isUniqueViolation } from '@/lib/db-errors';

export type PostCategoryFormState = { error?: string } | null;

function parse(fd: FormData) {
  return postCategorySchema.safeParse({
    id: fd.get('id'),
    name: fd.get('name'),
    description: fd.get('description') ?? '',
    sortOrder: fd.get('sortOrder') || 0,
  });
}

function friendlyWriteError(e: unknown): string {
  if (isUniqueViolation(e)) return 'Đường dẫn này đã có chuyên mục khác dùng — hãy đổi đường dẫn.';
  return (e as Error).message;
}

export async function createPostCategory(_prev: PostCategoryFormState, fd: FormData): Promise<PostCategoryFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try { await db.insert(postCategories).values(r.data); }
  catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/post-categories');
  revalidatePath('/tin-tuc');
  redirect('/admin/post-categories');
}

export async function updatePostCategory(
  originalId: string, _prev: PostCategoryFormState, fd: FormData,
): Promise<PostCategoryFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(postCategories).set({ ...r.data, updatedAt: new Date() })
      .where(eq(postCategories.id, originalId));
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/post-categories');
  revalidatePath('/tin-tuc');
  redirect('/admin/post-categories');
}

// posts.category_id is ON DELETE SET NULL, so removing a category leaves its
// posts published but uncategorised rather than deleting them.
export async function deletePostCategory(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(postCategories).where(eq(postCategories.id, id));
  revalidatePath('/admin/post-categories');
  revalidatePath('/tin-tuc');
  redirect('/admin/post-categories');
}

export async function bulkDeletePostCategories(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) redirect('/admin/post-categories');
  await db.delete(postCategories).where(inArray(postCategories.id, ids));
  revalidatePath('/admin/post-categories');
  revalidatePath('/tin-tuc');
  redirect('/admin/post-categories');
}
