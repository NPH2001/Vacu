'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { userCreateSchema, userUpdateSchema } from '@/lib/validators';
import { requireRole } from '@/lib/session';
import { hashPassword } from '@/lib/auth';

export type UserFormState = { error?: string } | null;

// pg error 23505 = unique_violation. Drizzle v4 wraps the pg error, so
// check both code and message on the error and its cause.
function isUniqueViolation(e: unknown): boolean {
  const err = e as { message?: string; code?: string; cause?: { message?: string; code?: string } };
  if (err.code === '23505' || err.cause?.code === '23505') return true;
  const msg = `${err.message ?? ''} ${err.cause?.message ?? ''}`;
  return /unique|duplicate/i.test(msg);
}

export async function createUser(_p: UserFormState, fd: FormData): Promise<UserFormState> {
  await requireRole('admin');
  const parsed = userCreateSchema.safeParse({
    email: fd.get('email'),
    name: fd.get('name'),
    role: fd.get('role'),
    password: fd.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };
  try {
    const { email, name, role, password } = parsed.data;
    await db.insert(users).values({ email, name, role, passwordHash: await hashPassword(password) });
  } catch (e) {
    if (isUniqueViolation(e)) return { error: 'Email đã tồn tại.' };
    return { error: (e as Error).message };
  }
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function updateUser(id: string, _p: UserFormState, fd: FormData): Promise<UserFormState> {
  await requireRole('admin');
  const pw = fd.get('password');
  const parsed = userUpdateSchema.safeParse({
    email: fd.get('email'),
    name: fd.get('name'),
    role: fd.get('role'),
    password: pw ? pw : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ' };

  const patch: Record<string, unknown> = {
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    updatedAt: new Date(),
  };
  if (parsed.data.password) {
    patch.passwordHash = await hashPassword(parsed.data.password);
    patch.passwordChangedAt = new Date(); // revoke this user's existing sessions
  }
  try {
    await db.update(users).set(patch).where(eq(users.id, id));
  } catch (e) {
    if (isUniqueViolation(e)) return { error: 'Email đã tồn tại.' };
    return { error: (e as Error).message };
  }
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function deleteUser(id: string): Promise<void> {
  const self = await requireRole('admin');
  // Explained on the list page rather than thrown — see lib/admin/flash.ts.
  if (self.id === id) redirect('/admin/users?loi=tu-xoa-tai-khoan');
  await db.delete(users).where(eq(users.id, id));
  revalidatePath('/admin/users');
  redirect('/admin/users');
}
