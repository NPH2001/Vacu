'use server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { hashPassword, verifyPassword } from '@/lib/auth';

const changePasswordSchema = z.object({
  current: z.string().min(1),
  next: z.string().min(8),
  confirm: z.string().min(8),
}).refine((v) => v.next === v.confirm, { message: 'Mật khẩu mới không khớp', path: ['confirm'] });

export type ChangePasswordState = { error?: string; ok?: boolean } | null;

export async function changeOwnPassword(_prev: ChangePasswordState, fd: FormData): Promise<ChangePasswordState> {
  const me = await getCurrentUser();
  if (!me) redirect('/admin/login');
  const parsed = changePasswordSchema.safeParse({
    current: fd.get('current'),
    next: fd.get('next'),
    confirm: fd.get('confirm'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const ok = await verifyPassword(parsed.data.current, me.passwordHash);
  if (!ok) return { error: 'Mật khẩu hiện tại không đúng.' };
  if (parsed.data.current === parsed.data.next) return { error: 'Mật khẩu mới phải khác mật khẩu cũ.' };

  await db.update(users)
    .set({ passwordHash: await hashPassword(parsed.data.next), updatedAt: new Date() })
    .where(eq(users.id, me.id));
  return { ok: true };
}
