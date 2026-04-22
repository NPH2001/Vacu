import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { farmers } from '@/db/schema';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteFarmer, bulkDeleteFarmers } from '@/app/admin/actions/farmers';

export default async function FarmersAdminPage() {
  const rows = await db.select().from(farmers).orderBy(asc(farmers.name));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Nông dân</h1>
        <Link href="/admin/farmers/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm nông dân
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-6 text-sm text-green-900/70">Chưa có nông dân.</div>
      ) : (
        <BulkDeleteForm action={bulkDeleteFarmers}>
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-green-900/70 bg-green-50/60">
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium w-14">Ảnh</th>
                  <th className="px-4 py-2.5 font-medium">Tên</th>
                  <th className="px-4 py-2.5 font-medium">Nông trại</th>
                  <th className="px-4 py-2.5 font-medium">Địa điểm</th>
                  <th className="px-4 py-2.5 font-medium">Năm</th>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-green-50">
                    <td className="px-4 py-2"><input type="checkbox" name="ids" value={r.id} /></td>
                    <td className="px-4 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.avatar && <img src={r.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/farmers/${r.id}`} className="font-medium text-green-950 hover:underline">{r.name}</Link>
                      <div className="text-xs text-green-900/60">{r.id}</div>
                    </td>
                    <td className="px-4 py-2">{r.farm}</td>
                    <td className="px-4 py-2">{r.location}</td>
                    <td className="px-4 py-2">{r.years}</td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link href={`/admin/farmers/${r.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton action={deleteFarmer.bind(null, r.id)} confirmText={`Xóa nông dân "${r.name}"?`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkDeleteForm>
      )}
    </div>
  );
}
