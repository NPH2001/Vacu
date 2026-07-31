'use server';
import { redirect } from 'next/navigation';
import { friendlyWriteError } from '@/lib/db-errors';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { certificates } from '@/db/schema';
import { certificateSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type CertificateFormState = { error?: string } | null;

function parse(fd: FormData) {
  return certificateSchema.safeParse({
    name: fd.get('name'),
    issuer: fd.get('issuer') ?? '',
    image: fd.get('image'),
    description: fd.get('description') ?? '',
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createCertificate(_p: CertificateFormState, fd: FormData): Promise<CertificateFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.insert(certificates).values(r.data);
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/certificates');
  revalidatePath('/', 'layout');
  redirect('/admin/certificates');
}

export async function updateCertificate(id: number, _p: CertificateFormState, fd: FormData): Promise<CertificateFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(certificates).set(r.data).where(eq(certificates.id, id));
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/certificates');
  revalidatePath('/', 'layout');
  redirect('/admin/certificates');
}

export async function deleteCertificate(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(certificates).where(eq(certificates.id, id));
  revalidatePath('/admin/certificates');
  revalidatePath('/', 'layout');
  redirect('/admin/certificates');
}

export async function bulkDeleteCertificates(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) redirect('/admin/certificates');
  await db.delete(certificates).where(inArray(certificates.id, ids));
  revalidatePath('/admin/certificates');
  revalidatePath('/', 'layout');
  redirect('/admin/certificates');
}
