import Link from 'next/link';
import ResetPasswordForm from '@/components/admin/ResetPasswordForm';

export default async function ResetPasswordPage({
  searchParams,
}: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/60 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold font-display text-green-950">Đặt lại mật khẩu</h1>
        {!token ? (
          <>
            <p className="text-sm text-red-600">Thiếu token. Hãy dùng link trong email chúng tôi gửi.</p>
            <Link href="/admin/forgot-password" className="text-sm text-green-700 hover:underline">
              ← Yêu cầu link mới
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-green-900/80">Nhập mật khẩu mới (tối thiểu 8 ký tự).</p>
            <ResetPasswordForm token={token} />
          </>
        )}
      </div>
    </div>
  );
}
