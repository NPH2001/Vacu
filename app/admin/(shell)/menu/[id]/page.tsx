import { notFound } from 'next/navigation';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories, menuItems } from '@/db/schema';
import MenuItemForm from '@/components/admin/MenuItemForm';
import { updateMenuItem } from '@/app/admin/actions/menu';

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();
  const [rows, cats] = await Promise.all([
    db.select().from(menuItems).where(eq(menuItems.id, num)).limit(1),
    db
      .select({
        id: categories.id, name: categories.name,
        parentId: categories.parentId, sortOrder: categories.sortOrder,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
  ]);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateMenuItem.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa mục menu</h1>
      <MenuItemForm action={bound} defaults={row} editing categories={cats} />
    </div>
  );
}
