'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
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
    rating: fd.get('rating') || 5,
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createTestimonial(_p: TestimonialFormState, fd: FormData): Promise<TestimonialFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    const { name, role, avatar, content, rating, sortOrder } = r.data;
    await db.insert(testimonials).values({ name, role, avatar, content, rating, sortOrder });
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/testimonials');
  redirect('/admin/testimonials');
}

export async function updateTestimonial(id: number, _p: TestimonialFormState, fd: FormData): Promise<TestimonialFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    const { name, role, avatar, content, rating, sortOrder } = r.data;
    await db.update(testimonials).set({ name, role, avatar, content, rating, sortOrder }).where(eq(testimonials.id, id));
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/testimonials');
  redirect('/admin/testimonials');
}

// See the note in actions/products.ts: uploads are shared, so files outlive the
// rows that reference them and are cleaned up from /admin/media instead.
export async function deleteTestimonial(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(testimonials).where(eq(testimonials.id, id));
  revalidatePath('/admin/testimonials');
  redirect('/admin/testimonials');
}

export async function bulkDeleteTestimonials(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) { redirect('/admin/testimonials'); }
  await db.delete(testimonials).where(inArray(testimonials.id, ids));
  revalidatePath('/admin/testimonials');
  redirect('/admin/testimonials');
}
