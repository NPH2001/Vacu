'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { farmers } from '@/db/schema';
import { farmerSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { deleteUpload, deleteUploadIfReplaced } from '@/lib/uploads';

export type FarmerFormState = { error?: string } | null;

function parse(fd: FormData) {
  const certs = String(fd.get('certifications') ?? '').trim();
  return farmerSchema.safeParse({
    id: fd.get('id'),
    name: fd.get('name'),
    farm: fd.get('farm'),
    location: fd.get('location'),
    years: fd.get('years'),
    specialty: fd.get('specialty'),
    avatar: fd.get('avatar'),
    cover: fd.get('cover'),
    story: fd.get('story'),
    certifications: certs ? certs.split(',').map((s) => s.trim()).filter(Boolean) : [],
  });
}

export async function createFarmer(_p: FarmerFormState, fd: FormData): Promise<FarmerFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try { await db.insert(farmers).values(r.data); }
  catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/farmers');
  redirect('/admin/farmers');
}

export async function updateFarmer(originalId: string, _p: FarmerFormState, fd: FormData): Promise<FarmerFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  const [existing] = await db.select({ avatar: farmers.avatar, cover: farmers.cover })
    .from(farmers).where(eq(farmers.id, originalId)).limit(1);
  try { await db.update(farmers).set({ ...r.data, updatedAt: new Date() }).where(eq(farmers.id, originalId)); }
  catch (e) { return { error: (e as Error).message }; }
  if (existing) {
    await Promise.allSettled([
      deleteUploadIfReplaced(existing.avatar, r.data.avatar),
      deleteUploadIfReplaced(existing.cover, r.data.cover),
    ]);
  }
  revalidatePath('/admin/farmers');
  redirect('/admin/farmers');
}

export async function deleteFarmer(id: string): Promise<void> {
  await requireAdmin();
  const [removed] = await db.delete(farmers).where(eq(farmers.id, id))
    .returning({ avatar: farmers.avatar, cover: farmers.cover });
  if (removed) {
    await Promise.allSettled([deleteUpload(removed.avatar), deleteUpload(removed.cover)]);
  }
  revalidatePath('/admin/farmers');
  redirect('/admin/farmers');
}

export async function bulkDeleteFarmers(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map(String).filter(Boolean);
  if (ids.length === 0) { redirect('/admin/farmers'); }
  const removed = await db.delete(farmers).where(inArray(farmers.id, ids))
    .returning({ avatar: farmers.avatar, cover: farmers.cover });
  await Promise.allSettled(removed.flatMap((r) => [deleteUpload(r.avatar), deleteUpload(r.cover)]));
  revalidatePath('/admin/farmers');
  redirect('/admin/farmers');
}
