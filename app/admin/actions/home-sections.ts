'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db/client';
import { homeSections } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { HOME_SECTIONS } from '@/lib/home-sections';

export type HomeSectionsFormState = { error?: string; ok?: boolean } | null;

const payloadSchema = z.array(z.object({
  key: z.string().refine((k) => k in HOME_SECTIONS, 'Khối không hợp lệ'),
  visible: z.boolean(),
})).min(1);

export async function saveHomeSections(
  _prev: HomeSectionsFormState, fd: FormData,
): Promise<HomeSectionsFormState> {
  await requireAdmin();

  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get('sections') ?? '[]'));
  } catch {
    return { error: 'Không đọc được thứ tự các khối.' };
  }
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  // The rows are a fixed set, so upsert rather than delete-and-reinsert: a
  // wipe would blank the homepage for anyone loading it mid-save.
  for (const [i, s] of parsed.data.entries()) {
    await db.insert(homeSections)
      .values({ key: s.key, visible: s.visible, sortOrder: i * 10 })
      .onConflictDoUpdate({
        target: homeSections.key,
        set: { visible: s.visible, sortOrder: i * 10 },
      });
  }

  revalidatePath('/admin/home-sections');
  revalidatePath('/');
  return { ok: true };
}
