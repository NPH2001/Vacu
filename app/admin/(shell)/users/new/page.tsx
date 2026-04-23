import UserForm from '@/components/admin/UserForm';
import { createUser } from '@/app/admin/actions/users';
import { requireRole } from '@/lib/session';

export default async function NewUserPage() {
  await requireRole('admin');
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Tài khoản mới</h1>
      <UserForm action={createUser} editing={false} />
    </div>
  );
}
