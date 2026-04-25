import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { menuItems } from '@/db/schema';
import MenuItemForm from '@/components/admin/MenuItemForm';
import { updateMenuItem } from '@/app/admin/actions/menu';

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();
  const rows = await db.select().from(menuItems).where(eq(menuItems.id, num)).limit(1);
  const row = rows[0];
  if (!row) notFound();
  const bound = updateMenuItem.bind(null, row.id);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa mục menu</h1>
      <MenuItemForm action={bound} defaults={row} editing />
    </div>
  );
}
