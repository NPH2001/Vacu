export const dynamic = 'force-dynamic';

import { permanentRedirect } from 'next/navigation';
import { getAllCategories, getAllProducts } from '@/lib/data';
import CategoryListing from '@/components/CategoryListing';

type SearchParams = Promise<{ c?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { c } = await searchParams;
  if (c && /^[a-z0-9-]+$/.test(c)) permanentRedirect(`/danh-muc/${c}`);

  const [allCategories, allProducts] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);
  const topLevel = allCategories.filter((cat) => !cat.parentId);
  return (
    <CategoryListing
      topLevel={topLevel}
      ancestors={[]}
      filtered={allProducts}
      allProducts={allProducts}
      activeCategory={null}
      allCategories={allCategories}
    />
  );
}
