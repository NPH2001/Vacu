import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { testimonials } from '@/db/schema';
import TestimonialForm from '@/components/admin/TestimonialForm';
import { updateTestimonial } from '@/app/admin/actions/testimonials';

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();
  const rows = await db.select().from(testimonials).where(eq(testimonials.id, num)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateTestimonial.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Sửa cảm nhận: {row.name}</h1>
      <TestimonialForm action={bound} defaults={row} editing />
    </div>
  );
}
