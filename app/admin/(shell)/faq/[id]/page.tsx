import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { faqItems } from '@/db/schema';
import FaqForm from '@/components/admin/FaqForm';
import { updateFaq } from '@/app/admin/actions/faq';

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();
  const rows = await db.select().from(faqItems).where(eq(faqItems.id, num)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateFaq.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Sửa FAQ</h1>
      <FaqForm action={bound} defaults={row} editing />
    </div>
  );
}
