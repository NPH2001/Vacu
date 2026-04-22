import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { farmers } from '@/db/schema';
import FarmerForm from '@/components/admin/FarmerForm';
import { updateFarmer } from '@/app/admin/actions/farmers';

export default async function EditFarmerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(farmers).where(eq(farmers.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateFarmer.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Sửa: {row.name}</h1>
      <FarmerForm action={bound} defaults={row} editing />
    </div>
  );
}
