import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { valueProps } from '@/db/schema';
import ValuePropForm from '@/components/admin/ValuePropForm';
import { updateValueProp } from '@/app/admin/actions/value-props';

export default async function EditValuePropPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();
  const rows = await db.select().from(valueProps).where(eq(valueProps.id, num)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateValueProp.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa điểm giá trị</h1>
      <ValuePropForm action={bound} defaults={row} editing />
    </div>
  );
}
