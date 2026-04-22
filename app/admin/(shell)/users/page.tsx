import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteUser } from '@/app/admin/actions/users';
import { requireRole } from '@/lib/session';

export default async function UsersAdminPage() {
  const self = await requireRole('admin');
  const rows = await db.select().from(users).orderBy(asc(users.email));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Tài khoản</h1>
        <Link href="/admin/users/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm tài khoản
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-green-900/70 bg-green-50/60">
            <tr>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Tên</th>
              <th className="px-4 py-2.5 font-medium">Vai trò</th>
              <th className="px-4 py-2.5 font-medium">Tạo lúc</th>
              <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-green-50">
                <td className="px-4 py-2">
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-green-950 hover:underline">{u.email}</Link>
                  {u.id === self.id && <span className="ml-2 text-xs text-amber-700">(bạn)</span>}
                </td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2 text-green-900/70">{u.createdAt.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2 text-right space-x-3">
                  <Link href={`/admin/users/${u.id}`} className="text-green-700 hover:underline">Sửa</Link>
                  {u.id !== self.id && (
                    <DeleteButton action={deleteUser.bind(null, u.id)} confirmText={`Xóa tài khoản "${u.email}"?`} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
