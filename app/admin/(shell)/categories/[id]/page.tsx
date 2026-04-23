import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import CategoryForm from '@/components/admin/CategoryForm';
import { updateCategory } from '@/app/admin/actions/categories';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateCategory.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa: {row.name}</h1>
      <CategoryForm action={bound} defaults={row} editing />
    </div>
  );
}
