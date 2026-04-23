import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { orderStatuses } from '@/db/schema';
import OrderStatusForm from '@/components/admin/OrderStatusForm';
import { updateOrderStatus } from '@/app/admin/actions/order-statuses';

export default async function EditOrderStatusPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const rows = await db.select().from(orderStatuses).where(eq(orderStatuses.key, key)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateOrderStatus.bind(null, row.key);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa trạng thái đơn</h1>
      <OrderStatusForm action={bound} defaults={row} />
    </div>
  );
}
