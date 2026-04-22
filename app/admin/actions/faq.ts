'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { faqItems } from '@/db/schema';
import { faqSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type FaqFormState = { error?: string } | null;

function parse(fd: FormData) {
  return faqSchema.safeParse({
    question: fd.get('question'),
    answer: fd.get('answer'),
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createFaq(_p: FaqFormState, fd: FormData): Promise<FaqFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    const { question, answer, sortOrder } = r.data;
    await db.insert(faqItems).values({ question, answer, sortOrder });
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/faq');
  redirect('/admin/faq');
}

export async function updateFaq(id: number, _p: FaqFormState, fd: FormData): Promise<FaqFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    const { question, answer, sortOrder } = r.data;
    await db.update(faqItems).set({ question, answer, sortOrder }).where(eq(faqItems.id, id));
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/faq');
  redirect('/admin/faq');
}

export async function deleteFaq(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(faqItems).where(eq(faqItems.id, id));
  revalidatePath('/admin/faq');
  redirect('/admin/faq');
}

export async function bulkDeleteFaq(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) { redirect('/admin/faq'); }
  await db.delete(faqItems).where(inArray(faqItems.id, ids));
  revalidatePath('/admin/faq');
  redirect('/admin/faq');
}
