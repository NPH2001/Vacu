import CategoryForm from '@/components/admin/CategoryForm';
import { createCategory } from '@/app/admin/actions/categories';

export default function NewCategoryPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Danh mục mới</h1>
      <CategoryForm action={createCategory} editing={false} />
    </div>
  );
}
