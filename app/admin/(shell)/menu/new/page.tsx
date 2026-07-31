import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories, menuItems } from '@/db/schema';
import MenuItemForm from '@/components/admin/MenuItemForm';
import { createMenuItem } from '@/app/admin/actions/menu';

export default async function NewMenuItemPage() {
  const [cats, menu] = await Promise.all([
    db
      .select({
        id: categories.id, name: categories.name,
        parentId: categories.parentId, sortOrder: categories.sortOrder,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select().from(menuItems),
  ]);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Thêm mục menu</h1>
      <MenuItemForm action={createMenuItem} editing={false} categories={cats} menuItems={menu} />
    </div>
  );
}
