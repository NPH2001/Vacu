import Link from 'next/link';
import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, categories, farmers, orders } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import { getAllOrderStatuses } from '@/lib/data';

export default async function AdminHome() {
  const [[p], [c], [f], [o], byStatus, latest, statusRows, [pendingRow]] = await Promise.all([
    db.select({ n: count() }).from(products),
    db.select({ n: count() }).from(categories),
    db.select({ n: count() }).from(farmers),
    db.select({ n: count() }).from(orders),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    getAllOrderStatuses(),
    db.select({ n: count() }).from(orders).where(eq(orders.status, 'pending')),
  ]);

  const statusMap = new Map<string, number>(byStatus.map((r) => [r.status, Number(r.n)]));
  const totalOrders = Number(o.n);
  const pending = Number(pendingRow?.n ?? 0);

  const tiles = [
    {
      label: 'Sản phẩm',
      value: Number(p.n),
      href: '/admin/products',
      rune: '✿',
      accent: '#15803d',
      accentSoft: '#dcfce7',
    },
    {
      label: 'Danh mục',
      value: Number(c.n),
      href: '/admin/categories',
      rune: '❖',
      accent: '#b45309',
      accentSoft: '#fef3c7',
    },
    {
      label: 'Nông dân',
      value: Number(f.n),
      href: '/admin/farmers',
      rune: '❀',
      accent: '#7c3aed',
      accentSoft: '#ede9fe',
    },
    {
      label: 'Đơn hàng',
      value: totalOrders,
      href: '/admin/orders',
      rune: '✦',
      accent: '#b91c1c',
      accentSoft: '#fee2e2',
    },
  ];

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="admin-eyebrow">Bảng điều khiển</div>
          <h1 className="admin-title text-4xl mt-1.5">Tổng quan</h1>
          <p className="text-sm text-stone-500 mt-2 max-w-lg">
            Tình hình chung của cửa hàng hôm nay. Click vào từng ô để đi vào chi tiết.
          </p>
        </div>
        {pending > 0 && (
          <Link
            href="/admin/orders?status=pending"
            className="admin-panel flex items-center gap-3 px-4 py-3 group hover:border-amber-300 transition-colors">
            <span
              className="h-9 w-9 rounded-full inline-flex items-center justify-center shrink-0"
              style={{ background: '#fef3c7', color: '#92400e' }}>
              !
            </span>
            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-amber-800">
                Cần xử lý
              </div>
              <div className="text-sm text-stone-900">
                <span className="font-semibold">{pending}</span> đơn đang chờ
              </div>
            </div>
            <span className="text-stone-400 group-hover:text-stone-900 transition-colors">→</span>
          </Link>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="admin-stat group block">
            <span
              className="admin-stat-rune"
              style={{ color: t.accent }}
              aria-hidden>
              {t.rune}
            </span>
            <div className="admin-eyebrow">{t.label}</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span
                className="font-display text-[40px] leading-none"
                style={{ color: t.accent, letterSpacing: '-0.04em', fontWeight: 600 }}>
                {t.value}
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[12px] text-stone-500 group-hover:text-stone-900 transition-colors">
              <span>Xem chi tiết</span>
              <span
                className="inline-block transition-transform group-hover:translate-x-0.5"
                aria-hidden>
                →
              </span>
            </div>
            {/* Bottom accent stripe */}
            <div
              className="absolute left-0 bottom-0 h-[2px] w-full"
              style={{
                background: `linear-gradient(90deg, ${t.accent} 0%, transparent 100%)`,
                opacity: 0.5,
              }}
            />
          </Link>
        ))}
      </div>

      {/* Status distribution */}
      <section className="admin-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="admin-eyebrow">Đơn hàng theo trạng thái</div>
            <h2 className="admin-title text-lg mt-0.5">Phân bổ</h2>
          </div>
          <div className="text-[13px] text-stone-500">
            Tổng: <span className="font-semibold text-stone-900">{totalOrders}</span>
          </div>
        </div>

        {totalOrders === 0 ? (
          <div className="text-sm text-stone-500 py-2">Chưa có đơn hàng nào.</div>
        ) : (
          <>
            {/* Stacked bar */}
            <div
              className="h-2.5 w-full rounded-full overflow-hidden flex"
              style={{ background: '#f1f5f9' }}>
              {statusRows.map((s) => {
                const n = statusMap.get(s.key) ?? 0;
                if (n === 0) return null;
                const pct = (n / totalOrders) * 100;
                const color = statusKeyToColor(s.key);
                return (
                  <div
                    key={s.key}
                    style={{ width: `${pct}%`, background: color }}
                    title={`${s.label}: ${n} (${pct.toFixed(0)}%)`}
                  />
                );
              })}
            </div>
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
              {statusRows.map((s) => {
                const n = statusMap.get(s.key) ?? 0;
                const color = statusKeyToColor(s.key);
                return (
                  <Link
                    key={s.key}
                    href={`/admin/orders?status=${s.key}`}
                    className="group flex items-center gap-2.5 py-1.5 pr-2 -mx-1 px-1 rounded-md hover:bg-stone-50 transition-colors">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ background: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] text-stone-500 truncate">{s.label}</div>
                      <div className="text-[15px] font-semibold text-stone-900 tabular-nums">
                        {n}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Recent orders */}
      <section className="admin-panel-flush">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--admin-hairline)' }}>
          <div>
            <div className="admin-eyebrow">Hoạt động</div>
            <h2 className="admin-title text-lg mt-0.5">Đơn gần đây</h2>
          </div>
          <Link
            href="/admin/orders"
            className="text-[13px] text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1">
            Tất cả đơn <span aria-hidden>→</span>
          </Link>
        </div>
        {latest.length === 0 ? (
          <div className="p-6 text-sm text-stone-500">Chưa có đơn hàng nào.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Khách</th>
                <th>Tổng</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((r) => {
                const color = statusKeyToColor(r.status);
                const label = statusRows.find((s) => s.key === r.status)?.label ?? r.status;
                return (
                  <tr key={r.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${r.id}`}
                        className="font-mono text-[12.5px] text-stone-900 hover:underline">
                        {r.id}
                      </Link>
                    </td>
                    <td>{r.customerName}</td>
                    <td className="tabular-nums">{formatPrice(r.total)}</td>
                    <td>
                      <span
                        className="admin-badge"
                        style={{
                          background: color + '22',
                          color: darkenHex(color),
                          borderColor: color + '33',
                        }}>
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: color }}
                        />
                        {label}
                      </span>
                    </td>
                    <td className="text-stone-500 tabular-nums text-[12.5px]">
                      {r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function statusKeyToColor(key: string): string {
  switch (key) {
    case 'pending':    return '#d97706';
    case 'preparing':  return '#2563eb';
    case 'delivering': return '#7c3aed';
    case 'delivered':  return '#15803d';
    case 'cancelled':  return '#b91c1c';
    default:           return '#78716c';
  }
}

function darkenHex(hex: string): string {
  // assume #rrggbb input; return slightly darker for text on soft bg
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 40);
  const g = Math.max(0, ((n >> 8) & 0xff) - 40);
  const b = Math.max(0, (n & 0xff) - 40);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}
