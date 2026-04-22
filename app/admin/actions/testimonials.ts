'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { testimonials } from '@/db/schema';
import { testimonialSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type TestimonialFormState = { error?: string } | null;

function parse(fd: FormData) {
  return testimonialSchema.safeParse({
    name: fd.get('name'),
    role: fd.get('role'),
    avatar: fd.get('avatar'),
    content: fd.get('content'),
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createTestimonial(_p: TestimonialFormState, fd: FormData): Promise<TestimonialFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    const { name, role, avatar, content, sortOrder } = r.data;
    await db.insert(testimonials).values({ name, role, avatar, content, sortOrder });
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/testimonials');
  redirect('/admin/testimonials');
}

export async function updateTestimonial(id: number, _p: TestimonialFormState, fd: FormData): Promise<TestimonialFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    const { name, role, avatar, content, sortOrder } = r.data;
    await db.update(testimonials).set({ name, role, avatar, content, sortOrder }).where(eq(testimonials.id, id));
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/testimonials');
  redirect('/admin/testimonials');
}

export async function deleteTestimonial(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(testimonials).where(eq(testimonials.id, id));
  revalidatePath('/admin/testimonials');
  redirect('/admin/testimonials');
}
