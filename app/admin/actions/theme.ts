'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { theme } from '@/db/schema';
import { themeSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';
import { DEFAULT_THEME } from '@/lib/theme';

export type ThemeFormState = { error?: string; ok?: boolean } | null;

export async function saveTheme(_prev: ThemeFormState, fd: FormData): Promise<ThemeFormState> {
  await requireAdmin();
  const r = themeSchema.safeParse({
    brandColor: fd.get('brandColor'),
    accentColor: fd.get('accentColor'),
    radiusScale: fd.get('radiusScale'),
    fontBody: fd.get('fontBody'),
    fontHeading: fd.get('fontHeading'),
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  await db.insert(theme).values({ id: 1, ...r.data })
    .onConflictDoUpdate({ target: theme.id, set: r.data });
  // The theme is read in the root layout, so the whole site must re-render.
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function resetTheme(): Promise<void> {
  await requireAdmin();
  await db.insert(theme).values({ id: 1, ...DEFAULT_THEME })
    .onConflictDoUpdate({ target: theme.id, set: DEFAULT_THEME });
  revalidatePath('/', 'layout');
  redirect('/admin/theme');
}
