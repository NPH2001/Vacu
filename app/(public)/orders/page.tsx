import Link from 'next/link';
import { cookies } from 'next/headers';
import { inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders, orderItems } from '@/db/schema';
import { MY_ORDERS_COOKIE, parseMyOrders } from '@/lib/orders-cookie';
import { formatPrice } from '@/lib/format';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Đã đặt',         color: 'bg-amber-100 text-amber-800' },
  preparing:  { label: 'Đang thu hoạch', color: 'bg-blue-100 text-blue-800' },
  delivering: { label: 'Đang giao',      color: 'bg-green-100 text-green-800' },
  delivered:  { label: 'Đã giao',        color: 'bg-stone-200 text-stone-700' },
  cancelled:  { label: 'Đã huỷ',         color: 'bg-red-100 text-red-700' },
};

export default async function OrdersPage({
  searchParams,
}: { searchParams: Promise<{ new?: string }> }) {
  const { new: newId } = await searchParams;
  const cookieStore = await cookies();
  const ids = parseMyOrders(cookieStore.get(MY_ORDERS_COOKIE)?.value);

  const myOrders = ids.length
    ? await db.select().from(orders).where(inArray(orders.id, ids))
    : [];
  myOrders.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  const allItems = myOrders.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, myOrders.map((o) => o.id)))
    : [];
  const itemsByOrder = new Map<string, typeof allItems>();
  for (const it of allItems) {
    const arr = itemsByOrder.get(it.orderId) ?? [];
    arr.push(it);
    itemsByOrder.set(it.orderId, arr);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      {newId && (
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-3xl p-8 mb-8 text-center">
          <div className="text-6xl mb-3">🌱</div>
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Đặt hàng thành công!</h2>
          <p className="text-green-100/90 mb-1">Mã đơn: <span className="font-bold">{newId}</span></p>
          <p className="text-green-100/80 text-sm">Cô nông dân sẽ thu hoạch rau của bạn vào sáng mai.</p>
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-green-950 font-display mb-2">Đơn hàng của tôi</h1>
      <p className="text-green-900/60 mb-8">Theo dõi rau từ vườn tới nhà</p>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-green-100 p-14 text-center">
          <div className="text-7xl mb-4">🧺</div>
          <h2 className="text-2xl font-bold text-green-950 mb-2 font-display">Chưa có đơn nào</h2>
          <p className="text-green-900/70 mb-6">Rau tươi đang chờ bạn trong vườn.</p>
          <Link href="/products" className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-3 rounded-full">
            Đi chợ nông trại →
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {myOrders.map((o) => {
            const s = STATUS_LABELS[o.status] ?? STATUS_LABELS.pending;
            const items = itemsByOrder.get(o.id) ?? [];
            return (
              <div key={o.id} className="bg-white rounded-3xl border border-green-100 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-xs text-green-900/60">Mã đơn</div>
                    <div className="font-bold text-green-950 text-lg">{o.id}</div>
                    <div className="text-xs text-green-900/60 mt-0.5">
                      {new Date(o.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${s.color}`}>{s.label}</span>
                </div>
                <ul className="space-y-2 mb-4 divide-y divide-green-50">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 text-sm pt-2 first:pt-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image} alt={it.name} className="w-11 h-11 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="text-green-950 font-semibold line-clamp-1">{it.name}</div>
                        <div className="text-xs text-green-900/60">{it.qty} × {it.unit}</div>
                      </div>
                      <div className="font-semibold text-green-800">{formatPrice(it.price * it.qty)}</div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-green-100 pt-4 grid md:grid-cols-3 gap-3 text-sm">
                  <div><div className="text-[11px] uppercase tracking-wider text-green-700 font-bold">Giao đến</div><div className="text-green-950">{o.address}</div></div>
                  <div><div className="text-[11px] uppercase tracking-wider text-green-700 font-bold">Khung giờ</div><div className="text-green-950">{o.deliverySlot}</div></div>
                  <div className="md:text-right"><div className="text-[11px] uppercase tracking-wider text-green-700 font-bold">Tổng tiền</div><div className="font-bold text-green-800 text-lg">{formatPrice(o.total)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
