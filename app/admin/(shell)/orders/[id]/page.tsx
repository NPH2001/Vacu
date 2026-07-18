import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders, orderItems } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import DeleteButton from '@/components/admin/DeleteButton';
import { updateOrderStatus, deleteOrder, markOrderPaid, markOrderUnpaid } from '@/app/admin/actions/orders';
import { getAllOrderStatuses } from '@/lib/data';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [[order], items, statusRows] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, id)).limit(1),
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    getAllOrderStatuses(),
  ]);
  if (!order) notFound();

  const updateAction = updateOrderStatus.bind(null, order.id);
  const paidAction = markOrderPaid.bind(null, order.id);
  const unpaidAction = markOrderUnpaid.bind(null, order.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/admin/orders" className="text-sm text-green-700 hover:underline">← Quay lại danh sách</Link>
          <h1 className="admin-title text-[28px] mt-1">Đơn <span className="font-mono">{order.id}</span></h1>
        </div>
        <DeleteButton action={deleteOrder.bind(null, order.id)} confirmText={`Xóa đơn ${order.id}?`} label="Xóa đơn" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <section className="md:col-span-2 space-y-4">
          <div className="admin-panel p-5">
            <h2 className="font-bold text-green-950 mb-3">Thông tin khách</h2>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-green-900/70">Tên</dt><dd>{order.customerName}</dd>
              <dt className="text-green-900/70">Điện thoại</dt><dd>{order.phone}</dd>
              <dt className="text-green-900/70">Địa chỉ</dt><dd>{order.address}</dd>
              <dt className="text-green-900/70">Khung giờ</dt><dd>{order.deliverySlot}</dd>
              {order.note && (<><dt className="text-green-900/70">Ghi chú</dt><dd>{order.note}</dd></>)}
              <dt className="text-green-900/70">Tạo lúc</dt><dd>{order.createdAt.toISOString().replace('T', ' ').slice(0, 16)}</dd>
              <dt className="text-green-900/70">Thanh toán</dt>
              <dd>
                {order.paymentMethod === 'bank' ? '🏦 Chuyển khoản' : '💵 Tiền mặt (COD)'}
                {' · '}
                <span className={order.paymentStatus === 'paid' ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>
                  {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </dd>
            </dl>
          </div>

          <div className="admin-panel-flush">
            <h2 className="font-bold text-green-950 px-5 py-4 border-b border-green-100">Sản phẩm</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="px-5 py-2 font-medium">Ảnh</th>
                  <th className="px-5 py-2 font-medium">Tên</th>
                  <th className="px-5 py-2 font-medium">Đơn giá</th>
                  <th className="px-5 py-2 font-medium">SL</th>
                  <th className="px-5 py-2 font-medium text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {i.image && <img src={i.image} alt="" className="w-10 h-10 rounded object-cover" />}
                    </td>
                    <td className="px-5 py-2">{i.name}<div className="text-xs text-green-900/60">{i.unit}</div></td>
                    <td className="px-5 py-2">{formatPrice(i.price)}</td>
                    <td className="px-5 py-2">{i.qty}</td>
                    <td className="px-5 py-2 text-right">{formatPrice(i.qty * i.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-green-100 bg-green-50/40">
                  <td colSpan={4} className="px-5 py-3 text-right font-semibold text-green-950">Tổng</td>
                  <td className="px-5 py-3 text-right font-bold text-green-950">{formatPrice(order.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="admin-panel p-5">
            <h2 className="font-bold text-green-950 mb-3">Trạng thái</h2>
            <form action={updateAction} className="space-y-3">
              <select name="status" defaultValue={order.status}
                className="w-full admin-input bg-white text-sm">
                {statusRows.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-full text-sm">
                Cập nhật
              </button>
            </form>
          </div>

          {order.paymentMethod === 'bank' && (
            <div className="admin-panel p-5">
              <h2 className="font-bold text-green-950 mb-3">Chuyển khoản</h2>
              {order.paymentStatus === 'unpaid' ? (
                <form action={paidAction}>
                  <p className="text-sm text-green-900/70 mb-3">
                    Kiểm tra biến động số dư ngân hàng (nội dung: <code className="font-mono bg-green-50 px-1 rounded">Thanh toan {order.id}</code>).
                  </p>
                  <button type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-full text-sm">
                    ✓ Xác nhận đã nhận tiền
                  </button>
                </form>
              ) : (
                <form action={unpaidAction}>
                  <p className="text-sm text-green-700 font-semibold mb-3">✓ Đã xác nhận thanh toán</p>
                  <button type="submit"
                    className="w-full text-xs text-red-600 hover:underline">
                    Hoàn tác (đánh dấu chưa thanh toán)
                  </button>
                </form>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
