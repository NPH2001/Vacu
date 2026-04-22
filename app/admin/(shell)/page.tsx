import Link from 'next/link';
import { count, desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, categories, farmers, orders } from '@/db/schema';
import { formatPrice } from '@/lib/format';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export default async function AdminHome() {
  const [[p], [c], [f], [o], byStatus, latest] = await Promise.all([
    db.select({ n: count() }).from(products),
    db.select({ n: count() }).from(categories),
    db.select({ n: count() }).from(farmers),
    db.select({ n: count() }).from(orders),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
  ]);

  const statusMap = new Map<string, number>(byStatus.map((r) => [r.status, Number(r.n)]));

  const cards = [
    { label: 'Sản phẩm', value: p.n, href: '/admin/products' },
    { label: 'Danh mục', value: c.n, href: '/admin/categories' },
    { label: 'Nông dân', value: f.n, href: '/admin/farmers' },
    { label: 'Đơn hàng', value: o.n, href: '/admin/orders' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display text-green-950">Tổng quan</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}
            className="bg-white rounded-2xl border border-green-100 p-5 hover:border-green-400 transition">
            <div className="text-sm text-green-900/70">{c.label}</div>
            <div className="text-3xl font-bold text-green-950 mt-1">{Number(c.value)}</div>
          </Link>
        ))}
      </div>

      <section className="bg-white rounded-2xl border border-green-100 p-5">
        <h2 className="font-bold text-green-950 mb-3">Đơn hàng theo trạng thái</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(STATUS_LABEL).map(([k, label]) => (
            <span key={k} className="px-3 py-1.5 rounded-full text-sm bg-green-50 border border-green-100 text-green-900">
              {label}: <strong className="text-green-950">{statusMap.get(k) ?? 0}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-green-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-green-100">
          <h2 className="font-bold text-green-950">Đơn gần đây</h2>
          <Link href="/admin/orders" className="text-sm text-green-700 hover:underline">Xem tất cả →</Link>
        </div>
        {latest.length === 0 ? (
          <div className="p-5 text-sm text-green-900/70">Chưa có đơn hàng nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-green-900/70">
              <tr>
                <th className="px-5 py-2 font-medium">Mã</th>
                <th className="px-5 py-2 font-medium">Khách</th>
                <th className="px-5 py-2 font-medium">Tổng</th>
                <th className="px-5 py-2 font-medium">Trạng thái</th>
                <th className="px-5 py-2 font-medium">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((r) => (
                <tr key={r.id} className="border-t border-green-50 hover:bg-green-50/40">
                  <td className="px-5 py-2">
                    <Link href={`/admin/orders/${r.id}`} className="font-mono text-green-800 hover:underline">{r.id}</Link>
                  </td>
                  <td className="px-5 py-2">{r.customerName}</td>
                  <td className="px-5 py-2">{formatPrice(r.total)}</td>
                  <td className="px-5 py-2">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="px-5 py-2 text-green-900/70">{r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
