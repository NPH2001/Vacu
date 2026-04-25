export const dynamic = 'force-dynamic';

import { permanentRedirect } from 'next/navigation';
import { getAllCategories, getAllProducts } from '@/lib/data';
import CategoryListing from '@/components/CategoryListing';

type SearchParams = Promise<{ c?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { c } = await searchParams;
  if (c) permanentRedirect(`/danh-muc/${c}`);

  const [categories, allProducts] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);
  return (
    <CategoryListing
      categories={categories}
      allProducts={allProducts}
      filtered={allProducts}
      activeCategory={null}
    />
  );
}
