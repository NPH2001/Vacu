'use server';
import { redirect } from 'next/navigation';
import { friendlyWriteError } from '@/lib/db-errors';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailTemplates } from '@/db/schema';
import { emailTemplateSchema } from '@/lib/validators';
import { requireRole } from '@/lib/session';

export type EmailTemplateFormState = { error?: string } | null;

export async function updateEmailTemplate(
  key: string,
  _p: EmailTemplateFormState,
  fd: FormData,
): Promise<EmailTemplateFormState> {
  // Admin-only: these are transactional/security emails (forgot_password,
  // payment_confirmed). Staff editing the surrounding HTML could inject
  // phishing content into mail the server sends. Config-tier, like settings.
  await requireRole('admin');
  const r = emailTemplateSchema.safeParse({
    name: fd.get('name'),
    description: fd.get('description') ?? '',
    subject: fd.get('subject'),
    bodyHtml: fd.get('bodyHtml'),
    enabled: fd.get('enabled') ? true : false,
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    await db.update(emailTemplates)
      .set({ ...r.data, updatedAt: new Date() })
      .where(eq(emailTemplates.key, key));
  } catch (e) { return { error: friendlyWriteError(e) }; }
  revalidatePath('/admin/email-templates');
  redirect('/admin/email-templates');
}
