import Link from 'next/link';
import { db } from '@/db/client';
import { siteInfo } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function ForgotPasswordPage() {
  const [info] = await db.select({ email: siteInfo.email }).from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50/60 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold font-display text-green-950">Quên mật khẩu?</h1>
        <p className="text-sm text-green-900/80">
          Hệ thống chưa gửi email đặt lại tự động. Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu:
        </p>
        {info?.email && (
          <p className="text-sm font-medium text-green-950 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            {info.email}
          </p>
        )}
        <Link href="/admin/login" className="inline-block text-sm text-green-700 hover:underline">← Về trang đăng nhập</Link>
      </div>
    </div>
  );
}
