import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories } from '@/db/schema';
import CategoryForm from '@/components/admin/CategoryForm';
import { createCategory } from '@/app/admin/actions/categories';

export default async function NewCategoryPage() {
  const rows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Danh mục mới</h1>
      <CategoryForm action={createCategory} editing={false} availableParents={rows} />
    </div>
  );
}
