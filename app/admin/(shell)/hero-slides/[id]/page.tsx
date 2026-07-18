import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { heroSlides } from '@/db/schema';
import HeroSlideForm from '@/components/admin/HeroSlideForm';
import { updateHeroSlide } from '@/app/admin/actions/hero-slides';

export default async function EditHeroSlidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  const rows = await db.select().from(heroSlides).where(eq(heroSlides.id, numId)).limit(1);
  const row = rows[0];
  if (!row) notFound();

  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px] truncate">Sửa slide: {row.title}</h1>
      <HeroSlideForm action={updateHeroSlide.bind(null, row.id)} defaults={row} editing />
    </div>
  );
}
