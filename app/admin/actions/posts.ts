'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { posts } from '@/db/schema';
import { postSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { sanitizeRichText, htmlToExcerpt } from '@/lib/sanitize';
import { isUniqueViolation, isFkViolation } from '@/lib/db-errors';

export type PostFormState = { error?: string } | null;

function friendlyWriteError(e: unknown): string {
  if (isUniqueViolation(e)) return 'Đường dẫn này đã có bài viết khác dùng rồi — hãy đổi đường dẫn.';
  if (isFkViolation(e)) return 'Chuyên mục đã chọn không còn tồn tại — hãy chọn lại.';
  return (e as Error).message;
}

function parseForm(fd: FormData) {
  const rawTags = String(fd.get('tags') ?? '').trim();
  return postSchema.safeParse({
    id: fd.get('id'),
    title: fd.get('title'),
    excerpt: fd.get('excerpt') ?? '',
    coverImage: fd.get('coverImage'),
    contentHtml: fd.get('contentHtml') ?? '',
    categoryId: fd.get('categoryId'),
    status: fd.get('status') ?? 'draft',
    publishedAt: fd.get('publishedAt') ?? undefined,
    featured: fd.get('featured') === 'on',
    tags: rawTags ? rawTags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    metaTitle: fd.get('metaTitle') ?? '',
    metaDescription: fd.get('metaDescription') ?? '',
  });
}

type Parsed = z.output<typeof postSchema>;

/**
 * Resolves the instant a post goes live.
 *
 * "Đăng ngay" submits an empty publishedAt, which means *now* only the first
 * time — `existing` keeps a live post's original date when the admin merely
 * edits it. Without that, every save re-stamped published_at, so fixing a typo
 * silently changed the article's date and shot it back to the top of /tin-tuc.
 * To move the date deliberately the admin picks one with "Hẹn giờ" (a past time
 * is allowed and backdates the post).
 *
 * Publishing must never leave published_at null: the row would be marked
 * published yet never satisfy the `published_at <= now()` visibility rule, so
 * the post would silently never appear.
 */
function resolvePublishedAt(data: Parsed, existing: Date | null): Date | null {
  if (data.status !== 'published') return data.publishedAt;
  return data.publishedAt ?? existing ?? new Date();
}

/**
 * The editor's HTML is a plain form field and can be forged, so it is
 * sanitized here rather than at render time.
 */
function toRow(data: Parsed, authorId: string, authorName: string, existingPublishedAt: Date | null = null) {
  const contentHtml = sanitizeRichText(data.contentHtml);
  // Excerpt drives list cards and search results; derive one when the admin
  // leaves it blank so cards are never empty.
  const excerpt = data.excerpt.trim() || htmlToExcerpt(contentHtml, 180);
  return {
    ...data,
    contentHtml,
    excerpt,
    publishedAt: resolvePublishedAt(data, existingPublishedAt),
    metaDescription: data.metaDescription.trim() || excerpt.slice(0, 300),
    authorId,
    authorName,
  };
}

export async function createPost(_prev: PostFormState, fd: FormData): Promise<PostFormState> {
  const user = await requireAdmin();
  const parsed = parseForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const row = toRow(parsed.data, user.id, user.name);
  try {
    await db.insert(posts).values(row);
  } catch (e) {
    return { error: friendlyWriteError(e) };
  }
  revalidatePath('/admin/posts');
  revalidatePath('/tin-tuc');
  redirect('/admin/posts');
}

export async function updatePost(originalId: string, _prev: PostFormState, fd: FormData): Promise<PostFormState> {
  const user = await requireAdmin();
  const parsed = parseForm(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  // The post's own publish date is what "Đăng ngay" falls back to on an edit,
  // so it has to be read before the write.
  const [existing] = await db.select({ publishedAt: posts.publishedAt })
    .from(posts).where(eq(posts.id, originalId)).limit(1);

  const row = toRow(parsed.data, user.id, user.name, existing?.publishedAt ?? null);
  try {
    await db.update(posts).set({ ...row, updatedAt: new Date() }).where(eq(posts.id, originalId));
  } catch (e) {
    return { error: friendlyWriteError(e) };
  }
  revalidatePath('/admin/posts');
  revalidatePath('/tin-tuc');
  revalidatePath(`/tin-tuc/${originalId}`);
  revalidatePath(`/tin-tuc/${row.id}`);
  redirect('/admin/posts');
}

export async function deletePost(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath('/admin/posts');
  revalidatePath('/tin-tuc');
  redirect('/admin/posts');
}

export async function bulkDeletePosts(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) redirect('/admin/posts');
  await db.delete(posts).where(inArray(posts.id, ids));
  revalidatePath('/admin/posts');
  revalidatePath('/tin-tuc');
  redirect('/admin/posts');
}
