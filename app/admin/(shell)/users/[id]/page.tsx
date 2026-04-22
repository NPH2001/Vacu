import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import UserForm from '@/components/admin/UserForm';
import { updateUser } from '@/app/admin/actions/users';
import { requireRole } from '@/lib/session';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const { id } = await params;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateUser.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Sửa: {row.email}</h1>
      <UserForm action={bound} defaults={row} editing />
    </div>
  );
}
