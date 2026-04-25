import MenuItemForm from '@/components/admin/MenuItemForm';
import { createMenuItem } from '@/app/admin/actions/menu';

export default function NewMenuItemPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Thêm mục menu</h1>
      <MenuItemForm action={createMenuItem} editing={false} />
    </div>
  );
}
