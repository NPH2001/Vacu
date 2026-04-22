'use server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';
import { loginSchema } from '@/lib/validators';

export type SignInState = { error?: string } | null;

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });
  if (!parsed.success) return { error: 'Email hoặc mật khẩu không hợp lệ.' };
  const { email, password, next } = parsed.data;

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) return { error: 'Sai email hoặc mật khẩu.' };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: 'Sai email hoặc mật khẩu.' };

  await setSessionCookie({ sub: user.id, role: user.role as 'admin' | 'staff' });
  redirect(next && next.startsWith('/admin') ? next : '/admin');
}
