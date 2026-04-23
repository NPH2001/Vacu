import DeliverySlotForm from '@/components/admin/DeliverySlotForm';
import { createDeliverySlot } from '@/app/admin/actions/delivery-slots';

export default function NewDeliverySlotPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Thêm khung giờ giao</h1>
      <DeliverySlotForm action={createDeliverySlot} editing={false} />
    </div>
  );
}
