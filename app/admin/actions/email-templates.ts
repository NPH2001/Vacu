'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailTemplates } from '@/db/schema';
import { emailTemplateSchema } from '@/lib/validators';
import { requireAdmin } from '@/lib/session';

export type EmailTemplateFormState = { error?: string } | null;

export async function updateEmailTemplate(
  key: string,
  _p: EmailTemplateFormState,
  fd: FormData,
): Promise<EmailTemplateFormState> {
  await requireAdmin();
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
  } catch (e) { return { error: (e as Error).message }; }
  revalidatePath('/admin/email-templates');
  redirect('/admin/email-templates');
}
