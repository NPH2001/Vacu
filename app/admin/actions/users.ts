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
    const msg = (e as Error).message;
    if (/unique|duplicate/i.test(msg)) return { error: 'Email đã tồn tại.' };
    return { error: msg };
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
  }
  try {
    await db.update(users).set(patch).where(eq(users.id, id));
  } catch (e) {
    const msg = (e as Error).message;
    if (/unique|duplicate/i.test(msg)) return { error: 'Email đã tồn tại.' };
    return { error: msg };
  }
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function deleteUser(id: string): Promise<void> {
  const self = await requireRole('admin');
  if (self.id === id) throw new Error('Không thể tự xóa tài khoản của chính mình.');
  await db.delete(users).where(eq(users.id, id));
  revalidatePath('/admin/users');
  redirect('/admin/users');
}
