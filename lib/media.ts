import 'server-only';
import { desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { media, products, posts, categories, farmers, type MediaRow } from '@/db/schema';

export type MediaListParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

/**
 * `%` and `_` are wildcards inside LIKE patterns, so a filename containing them
 * has to be escaped or the search silently matches everything: typing "50%"
 * while looking for "giam-50%.webp" would otherwise return every file starting
 * with "50". Backslash first — it is the escape character itself.
 */
function escapeLike(v: string): string {
  return v.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listMedia({ q, page = 1, pageSize = 40 }: MediaListParams = {}) {
  const term = q?.trim();
  const pattern = term ? `%${escapeLike(term)}%` : '';
  const where = term
    ? or(ilike(media.filename, pattern), ilike(media.alt, pattern))
    : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db.select().from(media).where(where)
      .orderBy(desc(media.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(media).where(where),
  ]);

  return { rows, total: count, page, pageSize, totalPages: Math.max(1, Math.ceil(count / pageSize)) };
}

export async function getMediaByUrl(url: string): Promise<MediaRow | null> {
  const rows = await db.select().from(media).where(eq(media.url, url)).limit(1);
  return rows[0] ?? null;
}

/**
 * Where a file is referenced. Deleting media is irreversible and the file may be
 * in use by content the admin isn't looking at, so the UI warns before deleting
 * rather than letting a page silently lose its image.
 *
 * Rich-text bodies embed URLs inside HTML, so those are matched with a
 * substring search rather than equality.
 */
export type MediaUsage = { kind: string; label: string; href: string };

export async function findMediaUsage(url: string): Promise<MediaUsage[]> {
  // Escaped for the same reason as the search: an underscore in a path would
  // otherwise match any character and over-report usage.
  const like = `%${escapeLike(url)}%`;
  const [prodImg, prodBody, postCover, postBody, cats, farmerImgs] = await Promise.all([
    db.select({ id: products.id, name: products.name }).from(products).where(eq(products.image, url)),
    db.select({ id: products.id, name: products.name }).from(products).where(ilike(products.body, like)),
    db.select({ id: posts.id, title: posts.title }).from(posts).where(eq(posts.coverImage, url)),
    db.select({ id: posts.id, title: posts.title }).from(posts).where(ilike(posts.contentHtml, like)),
    db.select({ id: categories.id, name: categories.name }).from(categories)
      .where(or(eq(categories.coverImage, url), eq(categories.icon, url))),
    db.select({ id: farmers.id, name: farmers.name }).from(farmers)
      .where(or(eq(farmers.avatar, url), eq(farmers.cover, url))),
  ]);

  const usage: MediaUsage[] = [];
  const seen = new Set<string>();
  const push = (kind: string, label: string, href: string) => {
    const key = `${kind}:${href}`;
    if (seen.has(key)) return;
    seen.add(key);
    usage.push({ kind, label, href });
  };

  for (const r of prodImg) push('Sản phẩm', r.name, `/admin/products/${r.id}`);
  for (const r of prodBody) push('Sản phẩm', r.name, `/admin/products/${r.id}`);
  for (const r of postCover) push('Bài viết', r.title, `/admin/posts/${r.id}`);
  for (const r of postBody) push('Bài viết', r.title, `/admin/posts/${r.id}`);
  for (const r of cats) push('Danh mục', r.name, `/admin/categories/${r.id}`);
  for (const r of farmerImgs) push('Nông dân', r.name, `/admin/farmers/${r.id}`);
  return usage;
}

export async function recordMedia(row: {
  url: string;
  filename: string;
  width: number;
  height: number;
  size: number;
  mime: string;
  uploadedBy: string | null;
}): Promise<MediaRow> {
  const [inserted] = await db.insert(media).values(row)
    .onConflictDoNothing({ target: media.url })
    .returning();
  if (inserted) return inserted;
  const existing = await getMediaByUrl(row.url);
  if (!existing) throw new Error('Không ghi được media');
  return existing;
}
