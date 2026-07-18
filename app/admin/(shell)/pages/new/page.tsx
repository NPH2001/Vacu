import PageForm from '@/components/admin/PageForm';
import { createPage } from '@/app/admin/actions/pages';
import { getAllCategories, getAllProducts } from '@/lib/data';

export default async function NewPagePage() {
  const [categories, products] = await Promise.all([getAllCategories(), getAllProducts()]);
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Trang mới</h1>
      <PageForm
        action={createPage}
        editing={false}
        categoryOptions={categories.map((c) => ({ id: c.id, name: c.name }))}
        productOptions={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
