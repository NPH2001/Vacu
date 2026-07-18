'use server';
import { redirect } from 'next/navigation';
import { friendlyWriteError } from '@/lib/db-errors';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { heroSlides } from '@/db/schema';
import { heroSlideSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type HeroSlideFormState = { error?: string } | null;

function parse(fd: FormData) {
  return heroSlideSchema.safeParse({
    badge: fd.get('badge') ?? '',
    title: fd.get('title'),
    subtitle: fd.get('subtitle') ?? '',
    image: fd.get('image'),
    ctaPrimaryLabel: fd.get('ctaPrimaryLabel') ?? '',
    ctaPrimaryHref: fd.get('ctaPrimaryHref') ?? '',
    ctaSecondaryLabel: fd.get('ctaSecondaryLabel') ?? '',
    ctaSecondaryHref: fd.get('ctaSecondaryHref') ?? '',
    active: fd.get('active') === 'on',
    sortOrder: fd.get('sortOrder') || 0,
  });
}

export async function createHeroSlide(_p: HeroSlideFormState, fd: FormData): Promise<HeroSlideFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.insert(heroSlides).values(r.data);
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/hero-slides');
  revalidatePath('/');
  redirect('/admin/hero-slides');
}

export async function updateHeroSlide(id: number, _p: HeroSlideFormState, fd: FormData): Promise<HeroSlideFormState> {
  await requireAdmin();
  const r = parse(fd);
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(heroSlides).set(r.data).where(eq(heroSlides.id, id));
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/hero-slides');
  revalidatePath('/');
  redirect('/admin/hero-slides');
}

// Images are shared via the media library, so they are left on disk here —
// removed only from /admin/media after a usage check.
export async function deleteHeroSlide(id: number): Promise<void> {
  await requireAdmin();
  await db.delete(heroSlides).where(eq(heroSlides.id, id));
  revalidatePath('/admin/hero-slides');
  revalidatePath('/');
  redirect('/admin/hero-slides');
}

export async function bulkDeleteHeroSlides(fd: FormData): Promise<void> {
  await requireAdmin();
  const ids = fd.getAll('ids').map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) redirect('/admin/hero-slides');
  await db.delete(heroSlides).where(inArray(heroSlides.id, ids));
  revalidatePath('/admin/hero-slides');
  revalidatePath('/');
  redirect('/admin/hero-slides');
}
