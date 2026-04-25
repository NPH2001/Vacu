import { notFound } from 'next/navigation';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import CategoryForm from '@/components/admin/CategoryForm';
import { updateCategory } from '@/app/admin/actions/categories';
import { getDescendantIds } from '@/lib/categories';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const all = await db.select().from(categories).orderBy(asc(categories.name));
  const blocked = new Set(getDescendantIds(row.id, all));
  const availableParents = all
    .filter((c) => !blocked.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));
  const bound = updateCategory.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa: {row.name}</h1>
      <CategoryForm action={bound} defaults={row} editing availableParents={availableParents} />
    </div>
  );
}
