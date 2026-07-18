import 'server-only';
import { cache } from 'react';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { pages, pageBlocks, type PageRow } from '@/db/schema';
import { blockSchema, type Block } from '@/lib/blocks';
import { sanitizeRichText } from '@/lib/sanitize';

export type LoadedBlock = { id: number; visible: boolean; data: Block };
export type LoadedPage = PageRow & { blocks: LoadedBlock[] };

/**
 * Block `data` is jsonb and could have been written by an older build or edited
 * by hand, so each row is re-validated on read (shape dropped if invalid) AND
 * rich-text is re-sanitized — a row not written through the admin action (SQL
 * edit, import, legacy) must not render unsanitized HTML.
 */
function parseBlocks(rows: { id: number; type: string; visible: boolean; data: unknown }[]): LoadedBlock[] {
  const out: LoadedBlock[] = [];
  for (const r of rows) {
    const parsed = blockSchema.safeParse({ ...(r.data as object), type: r.type });
    if (!parsed.success) continue;
    const data = parsed.data.type === 'richtext'
      ? { ...parsed.data, html: sanitizeRichText(parsed.data.html) }
      : parsed.data;
    out.push({ id: r.id, visible: r.visible, data });
  }
  return out;
}

async function loadBlocks(pageId: string): Promise<LoadedBlock[]> {
  const rows = await db.select({
    id: pageBlocks.id,
    type: pageBlocks.type,
    visible: pageBlocks.visible,
    data: pageBlocks.data,
  }).from(pageBlocks)
    .where(eq(pageBlocks.pageId, pageId))
    .orderBy(asc(pageBlocks.sortOrder), asc(pageBlocks.id));
  return parseBlocks(rows);
}

/**
 * Public read: published pages only, hidden blocks stripped.
 *
 * Cached per request — generateMetadata and the page component both load the
 * page, and Next only dedupes fetch(), not database calls.
 */
export const getPublishedPage = cache(async (slug: string): Promise<LoadedPage | null> => {
  const rows = await db.select().from(pages).where(eq(pages.id, slug)).limit(1);
  const page = rows[0];
  if (!page || page.status !== 'published') return null;
  const blocks = await loadBlocks(slug);
  return { ...page, blocks: blocks.filter((b) => b.visible) };
});

/** Admin read: any status, including hidden blocks (the builder shows them). */
export const getAnyPage = cache(async (slug: string): Promise<LoadedPage | null> => {
  const rows = await db.select().from(pages).where(eq(pages.id, slug)).limit(1);
  const page = rows[0];
  if (!page) return null;
  return { ...page, blocks: await loadBlocks(slug) };
});

export async function getAllPages(): Promise<Array<PageRow & { blockCount: number }>> {
  const [rows, blocks] = await Promise.all([
    db.select().from(pages).orderBy(asc(pages.title)),
    db.select({ pageId: pageBlocks.pageId }).from(pageBlocks),
  ]);
  const counts = new Map<string, number>();
  for (const b of blocks) counts.set(b.pageId, (counts.get(b.pageId) ?? 0) + 1);
  return rows.map((p) => ({ ...p, blockCount: counts.get(p.id) ?? 0 }));
}
