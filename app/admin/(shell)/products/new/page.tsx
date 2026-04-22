import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { categories, farmers } from '@/db/schema';
import ProductForm from '@/components/admin/ProductForm';
import { createProduct } from '@/app/admin/actions/products';

export default async function NewProductPage() {
  const [cats, farms] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.name)),
    db.select().from(farmers).orderBy(asc(farmers.name)),
  ]);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold font-display text-green-950">Sản phẩm mới</h1>
      <ProductForm action={createProduct} categories={cats} farmers={farms} editing={false} />
    </div>
  );
}
