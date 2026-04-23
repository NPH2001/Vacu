import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { orderStatuses } from '@/db/schema';

export default async function OrderStatusesAdminPage() {
  const rows = await db.select().from(orderStatuses).orderBy(asc(orderStatuses.sortOrder), asc(orderStatuses.key));
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Trạng thái đơn hàng</h1>
      <p className="text-sm text-green-900/70">5 trạng thái cố định theo hệ thống. Bạn có thể sửa nhãn, màu, và thứ tự hiển thị.</p>
      {rows.length === 0 ? (
        <div className="admin-panel p-6 text-sm text-red-600">
          Chưa seed trạng thái. Chạy lại migration Đợt 3.
        </div>
      ) : (
        <div className="admin-panel-flush">
          <table className="admin-table">
            <thead className="text-left bg-green-50/60 text-green-900/70">
              <tr>
                <th className="px-4 py-2.5 font-medium">Key</th>
                <th className="px-4 py-2.5 font-medium">Nhãn</th>
                <th className="px-4 py-2.5 font-medium">Màu</th>
                <th className="px-4 py-2.5 font-medium">Thứ tự</th>
                <th className="px-4 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="px-4 py-2 font-mono">{r.key}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${r.color}`}>{r.label}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-green-900/60">{r.color}</td>
                  <td className="px-4 py-2">{r.sortOrder}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/order-statuses/${r.key}`} className="text-green-700 hover:underline text-sm">Sửa</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
