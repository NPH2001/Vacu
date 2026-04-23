import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, categories, farmers } from '@/db/schema';
import ProductForm from '@/components/admin/ProductForm';
import { updateProduct } from '@/app/admin/actions/products';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [rows, cats, farms] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    db.select().from(categories).orderBy(asc(categories.name)),
    db.select().from(farmers).orderBy(asc(farmers.name)),
  ]);
  const row = rows[0];
  if (!row) notFound();

  const boundUpdate = updateProduct.bind(null, row.id);

  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa: {row.name}</h1>
      <ProductForm action={boundUpdate} defaults={row} categories={cats} farmers={farms} editing />
    </div>
  );
}
