'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { siteInfo } from '@/db/schema';
import { siteInfoSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type SettingsFormState = { error?: string; ok?: boolean } | null;

export async function updateSiteInfo(_prev: SettingsFormState, fd: FormData): Promise<SettingsFormState> {
  await requireAdmin();
  const parsed = siteInfoSchema.safeParse({
    name: fd.get('name'),
    shortName: fd.get('shortName'),
    tagline: fd.get('tagline'),
    description: fd.get('description'),
    address: fd.get('address'),
    phone: fd.get('phone'),
    email: fd.get('email'),
    hours: fd.get('hours'),
    statFarmers: fd.get('statFarmers'),
    statProducts: fd.get('statProducts'),
    statCustomers: fd.get('statCustomers'),
    statYears: fd.get('statYears'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(siteInfo).set(parsed.data).where(eq(siteInfo.id, 1));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { ok: true };
}
