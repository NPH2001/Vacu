import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { deliverySlots } from '@/db/schema';
import DeliverySlotForm from '@/components/admin/DeliverySlotForm';
import { updateDeliverySlot } from '@/app/admin/actions/delivery-slots';

export default async function EditDeliverySlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();
  const rows = await db.select().from(deliverySlots).where(eq(deliverySlots.id, num)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateDeliverySlot.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa khung giờ giao</h1>
      <DeliverySlotForm action={bound} defaults={row} editing />
    </div>
  );
}
