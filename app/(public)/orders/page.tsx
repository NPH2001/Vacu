export const dynamic = 'force-dynamic';

// Contains a customer's own order data — never index it (robots.txt disallows
// /orders too; this covers an externally-shared URL).
export const metadata = { robots: { index: false, follow: false } };

import Link from 'next/link';
import { cookies } from 'next/headers';
import { inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders, orderItems } from '@/db/schema';
import { MY_ORDERS_COOKIE, parseMyOrders } from '@/lib/orders-cookie';
import { formatPrice } from '@/lib/format';
import { getOrderStatusMap, getSiteInfo } from '@/lib/data';
import { findBank, vietQrImageUrl } from '@/lib/banks';
import PurchaseEvent from '@/components/PurchaseEvent';
import SmartImage from '@/components/SmartImage';

export default async function OrdersPage({
  searchParams,
}: { searchParams: Promise<{ new?: string }> }) {
  const { new: newId } = await searchParams;
  const cookieStore = await cookies();
  const ids = parseMyOrders(cookieStore.get(MY_ORDERS_COOKIE)?.value);

  const [statusMap, info] = await Promise.all([getOrderStatusMap(), getSiteInfo()]);
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

  const newOrder = newId ? myOrders.find((o) => o.id === newId) : undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      {newOrder && (
        <PurchaseEvent
          orderId={newOrder.id}
          value={newOrder.total}
          items={(itemsByOrder.get(newOrder.id) ?? []).map((it) => ({
            item_id: it.productId, item_name: it.name, price: it.price, quantity: it.qty,
          }))}
        />
      )}
      {/* h1 first so the heading order is h1 → h2 (the success banner), not h2
          before h1. The subtitle margin is dropped when the banner follows. */}
      <h1 className="text-3xl md:text-4xl font-bold text-green-950 font-display mb-2">Đơn hàng của tôi</h1>
      <p className={`text-green-900/60 ${newId ? 'mb-6' : 'mb-8'}`}>Theo dõi rau từ vườn tới nhà</p>
      {newId && (
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white rounded-3xl p-8 mb-8 text-center">
          <div className="text-6xl mb-3">🌱</div>
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">Đặt hàng thành công!</h2>
          <p className="text-green-100/90 mb-1">Mã đơn: <span className="font-bold">{newId}</span></p>
          <p className="text-green-100/80 text-sm wrap-anywhere">{info.orderSuccessNote}</p>
        </div>
      )}

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-green-100 p-14 text-center">
          <div className="text-7xl mb-4">🧺</div>
          <h2 className="text-2xl font-bold text-green-950 mb-2 font-display wrap-anywhere">{info.ordersEmptyTitle}</h2>
          <p className="text-green-900/70 mb-6 wrap-anywhere">{info.ordersEmptyText}</p>
          <Link href="/products" className="inline-block bg-green-700 hover:bg-green-800 text-white font-bold px-8 py-3 rounded-full">
            Đi chợ nông trại →
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {myOrders.map((o) => {
            const s = statusMap[o.status] ?? { label: o.status, color: 'bg-stone-100 text-stone-700' };
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
                      <SmartImage src={it.image} alt={it.name} className="w-11 h-11 rounded-lg object-cover" />
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
                {o.paymentMethod === 'bank' && o.paymentStatus === 'unpaid' && o.status !== 'cancelled'
                  && info.bankEnabled && info.bankBin && info.bankAccountNumber && (
                  <BankQrPanel
                    orderId={o.id}
                    total={o.total}
                    bin={info.bankBin}
                    accountNumber={info.bankAccountNumber}
                    accountHolder={info.bankAccountHolder}
                    bankName={info.bankName}
                  />
                )}
                {o.paymentMethod === 'bank' && o.paymentStatus === 'paid' && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-semibold">
                    ✓ Đã xác nhận thanh toán chuyển khoản
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BankQrPanel({
  orderId, total, bin, accountNumber, accountHolder, bankName,
}: {
  orderId: string; total: number; bin: string; accountNumber: string; accountHolder: string; bankName: string;
}) {
  const note = `Thanh toan ${orderId}`;
  const qrUrl = vietQrImageUrl({ bin, accountNumber, accountHolder, amount: total, note });
  const bank = findBank(bin);
  const bankDisplay = bankName || bank?.name || 'Ngân hàng';
  return (
    <div className="mt-4 border border-amber-200 bg-amber-50/70 rounded-2xl p-5">
      <div className="flex flex-wrap items-start gap-2 mb-3">
        <span className="text-xs font-bold bg-amber-400 text-green-950 px-2 py-0.5 rounded-full">CHƯA THANH TOÁN</span>
        <div className="text-sm text-green-900/80">Quét QR dưới đây bằng app ngân hàng để chuyển khoản. Nội dung và số tiền đã điền sẵn.</div>
      </div>
      <div className="grid md:grid-cols-2 gap-5 items-start">
        <div className="bg-white rounded-xl p-3 border border-amber-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR thanh toán ${orderId}`} className="w-full max-w-xs mx-auto" />
        </div>
        <dl className="text-sm space-y-2">
          <Row label="Ngân hàng" value={bankDisplay} />
          <Row label="Số tài khoản" value={accountNumber} mono />
          <Row label="Chủ tài khoản" value={accountHolder} />
          <Row label="Số tiền" value={formatPrice(total)} strong />
          <Row label="Nội dung" value={note} mono strong />
          <p className="text-xs text-green-900/60 pt-2">
            Sau khi chuyển, vui lòng đợi admin xác nhận. Đơn sẽ tự chuyển sang &quot;Đang thu hoạch&quot; khi nhận được tiền.
          </p>
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-green-900/60">{label}</dt>
      <dd className={`text-right ${mono ? 'font-mono' : ''} ${strong ? 'font-bold text-green-950' : 'text-green-950'}`}>{value}</dd>
    </div>
  );
}
