export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getAllCategories, getAllProducts, getSiteInfo } from '@/lib/data';
import { seoMeta } from '@/lib/seo';
import CategoryListing from '@/components/CategoryListing';
import ProductFilters from '@/components/ProductFilters';
import { filterAndSortProducts } from '@/lib/product-filter';

type SearchParams = Promise<{ c?: string; q?: string; sort?: string; con?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfo();
  return seoMeta({
    title: `${info.productsPageTitle || 'Sản phẩm'} — ${info.name}`,
    description: info.productsPageSubtitle,
    canonical: '/products',
  });
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { c, q, sort, con } = await searchParams;
  if (c && /^[a-z0-9-]+$/.test(c)) permanentRedirect(`/danh-muc/${c}`);

  const [allCategories, allProducts, info] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
    getSiteInfo(),
  ]);
  const topLevel = allCategories.filter((cat) => !cat.parentId);
  const filtered = filterAndSortProducts(allProducts, { q, sort, inStockOnly: con === '1' });
  return (
    <CategoryListing
      topLevel={topLevel}
      ancestors={[]}
      filtered={filtered}
      allProducts={allProducts}
      activeCategory={null}
      allCategories={allCategories}
      filters={<ProductFilters resultCount={filtered.length} />}
      emptyText={q || con ? 'Không tìm thấy sản phẩm nào khớp bộ lọc.' : 'Chưa có sản phẩm nào.'}
      rootTitle={info.productsPageTitle}
      rootSubtitle={info.productsPageSubtitle}
      badge={info.listingBadge}
    />
  );
}
