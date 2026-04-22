import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { orders, orderItems } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import DeleteButton from '@/components/admin/DeleteButton';
import { updateOrderStatus, deleteOrder } from '@/app/admin/actions/orders';

const STATUSES = ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'] as const;
const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  pending: 'Chờ xử lý',
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [[order], items] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, id)).limit(1),
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
  ]);
  if (!order) notFound();

  const updateAction = updateOrderStatus.bind(null, order.id);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href="/admin/orders" className="text-sm text-green-700 hover:underline">← Quay lại danh sách</Link>
          <h1 className="text-2xl font-bold font-display text-green-950 mt-1">Đơn <span className="font-mono">{order.id}</span></h1>
        </div>
        <DeleteButton action={deleteOrder.bind(null, order.id)} confirmText={`Xóa đơn ${order.id}?`} label="Xóa đơn" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <section className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-green-100 p-5">
            <h2 className="font-bold text-green-950 mb-3">Thông tin khách</h2>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-green-900/70">Tên</dt><dd>{order.customerName}</dd>
              <dt className="text-green-900/70">Điện thoại</dt><dd>{order.phone}</dd>
              <dt className="text-green-900/70">Địa chỉ</dt><dd>{order.address}</dd>
              <dt className="text-green-900/70">Khung giờ</dt><dd>{order.deliverySlot}</dd>
              {order.note && (<><dt className="text-green-900/70">Ghi chú</dt><dd>{order.note}</dd></>)}
              <dt className="text-green-900/70">Tạo lúc</dt><dd>{order.createdAt.toISOString().replace('T', ' ').slice(0, 16)}</dd>
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <h2 className="font-bold text-green-950 px-5 py-4 border-b border-green-100">Sản phẩm</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-green-900/70 bg-green-50/60">
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
                  <tr key={i.id} className="border-t border-green-50">
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

        <aside className="bg-white rounded-2xl border border-green-100 p-5 h-fit">
          <h2 className="font-bold text-green-950 mb-3">Trạng thái</h2>
          <form action={updateAction} className="space-y-3">
            <select name="status" defaultValue={order.status}
              className="w-full border border-green-200 rounded px-3 py-2 bg-white text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <button type="submit"
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-full text-sm">
              Cập nhật
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
