import ChangePasswordForm from '@/components/admin/ChangePasswordForm';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { changeOwnPassword } from '@/app/admin/actions/account';

export default async function AccountPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/admin/login');
  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="text-2xl font-bold font-display text-green-950">Tài khoản của tôi</h1>
      <div className="bg-white rounded-2xl border border-green-100 p-6 space-y-1">
        <div className="text-sm text-green-900/70">Email</div>
        <div className="font-medium text-green-950">{me.email}</div>
        <div className="text-sm text-green-900/70 mt-3">Vai trò</div>
        <div className="font-medium text-green-950">{me.role}</div>
      </div>
      <section className="space-y-3">
        <h2 className="font-bold text-green-950">Đổi mật khẩu</h2>
        <ChangePasswordForm action={changeOwnPassword} />
      </section>
    </div>
  );
}
