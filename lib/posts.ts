import 'server-only';
import { cache } from 'react';
import { and, desc, eq, lte, ne, sql, or, ilike } from 'drizzle-orm';
import { db } from '@/db/client';
import { posts, postCategories, type PostRow, type PostCategoryRow } from '@/db/schema';
import { escapeLike } from './sql-like';

export type Post = PostRow;
export type PostCategory = PostCategoryRow;
export type PostWithCategory = PostRow & { categoryName: string | null };

/**
 * The single definition of "the public can see this". A post is live only when
 * it is published *and* its publish time has arrived, which is what makes
 * scheduling work without a cron: the row simply starts matching this filter.
 * Every public-facing query must go through here — a query that forgets the
 * time check would leak scheduled posts early.
 */
function livePosts() {
  return and(eq(posts.status, 'published'), lte(posts.publishedAt, new Date()));
}

const withCategory = {
  id: posts.id,
  title: posts.title,
  excerpt: posts.excerpt,
  coverImage: posts.coverImage,
  contentHtml: posts.contentHtml,
  categoryId: posts.categoryId,
  authorId: posts.authorId,
  authorName: posts.authorName,
  status: posts.status,
  publishedAt: posts.publishedAt,
  featured: posts.featured,
  tags: posts.tags,
  metaTitle: posts.metaTitle,
  metaDescription: posts.metaDescription,
  createdAt: posts.createdAt,
  updatedAt: posts.updatedAt,
  categoryName: postCategories.name,
};

export async function getPublishedPosts({
  categoryId, page = 1, pageSize = 9, q,
}: { categoryId?: string; page?: number; pageSize?: number; q?: string } = {}) {
  page = Math.max(1, Math.floor(page)); // never a negative OFFSET
  const filters = [livePosts()];
  if (categoryId) filters.push(eq(posts.categoryId, categoryId));
  if (q?.trim()) {
    const like = `%${escapeLike(q.trim())}%`;
    filters.push(or(ilike(posts.title, like), ilike(posts.excerpt, like))!);
  }
  const where = and(...filters);

  const [rows, [{ count }]] = await Promise.all([
    db.select(withCategory).from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .where(where)
      .orderBy(desc(posts.featured), desc(posts.publishedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(where),
  ]);

  return {
    rows: rows as PostWithCategory[],
    total: count,
    page,
    totalPages: Math.max(1, Math.ceil(count / pageSize)),
  };
}

// Cached per request: generateMetadata and the page component each look the
// post up, and Next only dedupes fetch(), not database calls.
export const getPublishedPost = cache(async (id: string): Promise<PostWithCategory | null> => {
  const rows = await db.select(withCategory).from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .where(and(eq(posts.id, id), livePosts()))
    .limit(1);
  return (rows[0] as PostWithCategory) ?? null;
});

/** Admin preview: fetches regardless of status/schedule. */
export const getAnyPost = cache(async (id: string): Promise<PostWithCategory | null> => {
  const rows = await db.select(withCategory).from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .where(eq(posts.id, id))
    .limit(1);
  return (rows[0] as PostWithCategory) ?? null;
});

export async function getRelatedPosts(post: PostRow, limit = 3): Promise<PostWithCategory[]> {
  const filters = [livePosts(), ne(posts.id, post.id)];
  if (post.categoryId) filters.push(eq(posts.categoryId, post.categoryId));

  const rows = await db.select(withCategory).from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .where(and(...filters))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  // A post in a small or unset category may have no siblings — fall back to the
  // newest posts so the section is never empty.
  if (rows.length < limit) {
    const fill = await db.select(withCategory).from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .where(and(livePosts(), ne(posts.id, post.id)))
      .orderBy(desc(posts.publishedAt))
      .limit(limit);
    const seen = new Set(rows.map((r) => r.id));
    for (const r of fill as PostWithCategory[]) {
      if (rows.length >= limit) break;
      if (!seen.has(r.id)) { rows.push(r); seen.add(r.id); }
    }
  }
  return rows as PostWithCategory[];
}

export async function getLatestPosts(limit = 3): Promise<PostWithCategory[]> {
  const rows = await db.select(withCategory).from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .where(livePosts())
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
  return rows as PostWithCategory[];
}

export async function getAllPostCategories(): Promise<PostCategoryRow[]> {
  return db.select().from(postCategories)
    .orderBy(postCategories.sortOrder, postCategories.name);
}

/** A single post category by id — backs the /danh-muc-tin-tuc/[id] page. */
export const getPostCategory = cache(async (id: string): Promise<PostCategoryRow | null> => {
  const rows = await db.select().from(postCategories).where(eq(postCategories.id, id)).limit(1);
  return rows[0] ?? null;
});

/** Categories that actually have something live in them, with counts. */
export async function getPostCategoriesWithCounts() {
  return db.select({
    id: postCategories.id,
    name: postCategories.name,
    description: postCategories.description,
    count: sql<number>`count(${posts.id})::int`,
  })
    .from(postCategories)
    .leftJoin(posts, and(eq(posts.categoryId, postCategories.id), livePosts()))
    .groupBy(postCategories.id, postCategories.name, postCategories.description, postCategories.sortOrder)
    .having(sql`count(${posts.id}) > 0`) // only categories with at least one live post
    .orderBy(postCategories.sortOrder, postCategories.name);
}
