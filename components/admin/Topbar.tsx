import Link from 'next/link';

export default function Topbar({ email }: { email: string }) {
  return (
    <header className="h-14 border-b border-green-100 bg-white flex items-center justify-between px-6">
      <div className="text-sm text-green-900/70">
        <Link href="/admin/account" className="hover:underline">Xin chào, {email}</Link>
      </div>
      <form action="/api/auth/logout" method="post">
        <button type="submit" className="text-sm text-green-700 font-semibold hover:underline">Đăng xuất</button>
      </form>
    </header>
  );
}
