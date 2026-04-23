import PaymentMethodForm from '@/components/admin/PaymentMethodForm';
import { createPaymentMethod } from '@/app/admin/actions/payment-methods';

export default function NewPaymentMethodPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Thêm phương thức thanh toán</h1>
      <PaymentMethodForm action={createPaymentMethod} editing={false} />
    </div>
  );
}
