'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { media } from '@/db/schema';
import { requireAdmin } from '@/lib/session';
import { deleteUpload } from '@/lib/uploads';
import { findMediaUsage, type MediaUsage } from '@/lib/media';

export type MediaActionState = { error?: string; ok?: string } | null;

export async function updateMediaAlt(url: string, alt: string): Promise<MediaActionState> {
  await requireAdmin();
  await db.update(media).set({ alt: alt.slice(0, 300) }).where(eq(media.url, url));
  revalidatePath('/admin/media');
  return { ok: 'Đã lưu mô tả ảnh.' };
}

export type DeleteMediaResult =
  | { deleted: true }
  | { deleted: false; usage: MediaUsage[] };

/**
 * Deleting media is irreversible and the file may back content the admin isn't
 * currently looking at, so an in-use file is refused and its referrers returned
 * for the UI to show. `force` is the deliberate second step after that warning.
 */
export async function deleteMedia(url: string, force = false): Promise<DeleteMediaResult> {
  await requireAdmin();

  if (!force) {
    const usage = await findMediaUsage(url);
    if (usage.length > 0) return { deleted: false, usage };
  }

  await db.delete(media).where(eq(media.url, url));
  await deleteUpload(url);
  revalidatePath('/admin/media');
  return { deleted: true };
}

export async function getMediaUsage(url: string): Promise<MediaUsage[]> {
  await requireAdmin();
  return findMediaUsage(url);
}
