'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db/client';
import { pages, pageBlocks } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { sanitizeRichText } from '@/lib/sanitize';
import { blockListSchema, RESERVED_SLUGS, HOME_PAGE_ID, type BlockEntry } from '@/lib/blocks';
import { isUniqueViolation, friendlyWriteError } from '@/lib/db-errors';

export type PageFormState = { error?: string } | null;

const slug = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Đường dẫn kiểu: chữ thường, số, gạch ngang');

const pageMetaSchema = z.object({
  id: slug,
  title: z.string().min(1).max(200),
  status: z.enum(['draft', 'published']).default('draft'),
  metaTitle: z.string().max(200).default(''),
  metaDescription: z.string().max(300).default(''),
});

function parse(fd: FormData) {
  const meta = pageMetaSchema.safeParse({
    id: fd.get('id'),
    title: fd.get('title'),
    status: fd.get('status') ?? 'draft',
    metaTitle: fd.get('metaTitle') ?? '',
    metaDescription: fd.get('metaDescription') ?? '',
  });
  if (!meta.success) return { ok: false as const, error: meta.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  // The builder submits every block as one JSON payload.
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get('blocks') ?? '[]'));
  } catch {
    return { ok: false as const, error: 'Không đọc được nội dung các khối.' };
  }
  const blocks = blockListSchema.safeParse(raw);
  if (!blocks.success) {
    return { ok: false as const, error: `Khối nội dung không hợp lệ: ${blocks.error.issues[0]?.message ?? ''}` };
  }

  return { ok: true as const, meta: meta.data, blocks: blocks.data };
}

/** Rich-text arrives as untrusted HTML wherever it appears in a block. */
function sanitizeBlock(entry: BlockEntry): BlockEntry {
  if (entry.data.type !== 'richtext') return entry;
  return { ...entry, data: { ...entry.data, html: sanitizeRichText(entry.data.html) } };
}

// `exec` is the db or a transaction handle so the page row and its blocks are
// written atomically (a block failure must not leave an orphan page holding the
// slug).
type Executor = typeof db;
async function replaceBlocks(exec: Executor, pageId: string, entries: BlockEntry[]) {
  await exec.delete(pageBlocks).where(eq(pageBlocks.pageId, pageId));
  if (entries.length === 0) return;
  await exec.insert(pageBlocks).values(entries.map((e, i) => {
    const { type, ...data } = sanitizeBlock(e).data;
    return { pageId, type, data, visible: e.visible, sortOrder: i * 10 };
  }));
}

export async function createPage(_prev: PageFormState, fd: FormData): Promise<PageFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.ok) return { error: r.error };

  // A static route always wins over the catch-all, so this page would save but
  // never be reachable.
  if (RESERVED_SLUGS.has(r.meta.id)) {
    return { error: `Đường dẫn "${r.meta.id}" đã được hệ thống dùng — hãy chọn đường dẫn khác.` };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(pages).values(r.meta);
      await replaceBlocks(tx as unknown as Executor, r.meta.id, r.blocks);
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: 'Đường dẫn này đã có trang khác dùng — hãy đổi đường dẫn.' };
    return { error: friendlyWriteError(e) };
  }
  revalidatePath('/admin/pages');
  revalidatePath(`/${r.meta.id}`);
  redirect(`/admin/pages/${r.meta.id}`);
}

export async function updatePage(originalId: string, _prev: PageFormState, fd: FormData): Promise<PageFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.ok) return { error: r.error };

  try {
    await db.transaction(async (tx) => {
      await tx.update(pages).set({
        title: r.meta.title,
        status: r.meta.status,
        metaTitle: r.meta.metaTitle,
        metaDescription: r.meta.metaDescription,
        updatedAt: new Date(),
      }).where(eq(pages.id, originalId));
      await replaceBlocks(tx as unknown as Executor, originalId, r.blocks);
    });
  } catch (e) {
    return { error: friendlyWriteError(e) };
  }
  revalidatePath('/admin/pages');
  revalidatePath(`/admin/pages/${originalId}`);
  revalidatePath(`/${originalId}`);
  redirect('/admin/pages');
}

// page_blocks cascades, so the blocks go with the page.
export async function deletePage(id: string): Promise<void> {
  await requireAdmin();
  // The homepage row backs `/`; deleting it would strip the homepage to the
  // code fallback and lose any layout the admin arranged. Never allow it.
  if (id === HOME_PAGE_ID) redirect('/admin/pages?loi=khong-xoa-trang-chu');
  await db.delete(pages).where(eq(pages.id, id));
  revalidatePath('/admin/pages');
  revalidatePath(`/${id}`);
  redirect('/admin/pages');
}
