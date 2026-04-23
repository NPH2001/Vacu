import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { paymentMethods } from '@/db/schema';
import PaymentMethodForm from '@/components/admin/PaymentMethodForm';
import { updatePaymentMethod } from '@/app/admin/actions/payment-methods';

export default async function EditPaymentMethodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updatePaymentMethod.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa phương thức thanh toán</h1>
      <PaymentMethodForm action={bound} defaults={row} editing />
    </div>
  );
}
