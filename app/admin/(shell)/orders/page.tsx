import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders } from '@/db/schema';
import { formatPrice } from '@/lib/format';

type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  preparing: 'bg-sky-100 text-sky-800',
  delivering: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter: OrderStatus | null = status && status in STATUS_LABEL ? (status as OrderStatus) : null;

  const baseQuery = db.select().from(orders);
  const rows = await (statusFilter
    ? baseQuery.where(eq(orders.status, statusFilter)).orderBy(desc(orders.createdAt))
    : baseQuery.orderBy(desc(orders.createdAt)));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Đơn hàng</h1>

      <div className="flex gap-2 flex-wrap">
        <FilterPill href="/admin/orders" active={!statusFilter}>Tất cả</FilterPill>
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <FilterPill key={k} href={`/admin/orders?status=${k}`} active={statusFilter === k}>{label}</FilterPill>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-green-900/70">Không có đơn hàng.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-green-900/70 bg-green-50/60">
              <tr>
                <th className="px-4 py-2.5 font-medium">Mã</th>
                <th className="px-4 py-2.5 font-medium">Khách</th>
                <th className="px-4 py-2.5 font-medium">Điện thoại</th>
                <th className="px-4 py-2.5 font-medium">Tổng</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-green-50 hover:bg-green-50/40">
                  <td className="px-4 py-2">
                    <Link href={`/admin/orders/${r.id}`} className="font-mono text-green-800 hover:underline">{r.id}</Link>
                  </td>
                  <td className="px-4 py-2">{r.customerName}</td>
                  <td className="px-4 py-2">{r.phone}</td>
                  <td className="px-4 py-2">{formatPrice(r.total)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[r.status] ?? 'bg-green-50 text-green-800'}`}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-green-900/70">{r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href}
      className={`px-3 py-1.5 rounded-full text-sm border ${
        active ? 'bg-green-700 text-white border-green-700' : 'bg-white text-green-900 border-green-200 hover:border-green-400'
      }`}>
      {children}
    </Link>
  );
}
