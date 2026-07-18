import { notFound } from 'next/navigation';
import PageForm from '@/components/admin/PageForm';
import { updatePage } from '@/app/admin/actions/pages';
import { getAnyPage } from '@/lib/pages';
import { getAllCategories, getAllProducts } from '@/lib/data';

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page, categories, products] = await Promise.all([
    getAnyPage(id), getAllCategories(), getAllProducts(),
  ]);
  if (!page) notFound();

  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px] truncate">Sửa trang: {page.title}</h1>
      <PageForm
        action={updatePage.bind(null, page.id)}
        defaults={page}
        blocks={page.blocks.map((b) => ({ visible: b.visible, data: b.data }))}
        editing
        categoryOptions={categories.map((c) => ({ id: c.id, name: c.name }))}
        productOptions={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
