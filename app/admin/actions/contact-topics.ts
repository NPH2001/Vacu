'use server';
import { redirect } from 'next/navigation';
import { friendlyWriteError } from '@/lib/db-errors';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { contactTopics } from '@/db/schema';
import { contactTopicSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type ContactTopicFormState = { error?: string } | null;

function parse(fd: FormData) {
  return contactTopicSchema.safeParse({
    label: fd.get('label'),
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createContactTopic(_p: ContactTopicFormState, fd: FormData): Promise<ContactTopicFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.insert(contactTopics).values(r.data);
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/contact-topics');
  revalidatePath('/contact');
  redirect('/admin/contact-topics');
}

export async function updateContactTopic(id: number, _p: ContactTopicFormState, fd: FormData): Promise<ContactTopicFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(contactTopics).set(r.data).where(eq(contactTopics.id, id));
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/contact-topics');
  revalidatePath('/contact');
  redirect('/admin/contact-topics');
}

export async function deleteContactTopic(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(contactTopics).where(eq(contactTopics.id, id));
  revalidatePath('/admin/contact-topics');
  revalidatePath('/contact');
  redirect('/admin/contact-topics');
}

export async function bulkDeleteContactTopics(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) redirect('/admin/contact-topics');
  await db.delete(contactTopics).where(inArray(contactTopics.id, ids));
  revalidatePath('/admin/contact-topics');
  revalidatePath('/contact');
  redirect('/admin/contact-topics');
}
