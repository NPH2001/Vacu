import CategoryForm from '@/components/admin/CategoryForm';
import { createCategory } from '@/app/admin/actions/categories';

export default function NewCategoryPage() {
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Danh mục mới</h1>
      <CategoryForm action={createCategory} editing={false} />
    </div>
  );
}
