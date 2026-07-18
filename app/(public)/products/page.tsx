export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getAllCategories, getAllProducts, getSiteInfo } from '@/lib/data';
import { seoMeta } from '@/lib/seo';
import CategoryListing from '@/components/CategoryListing';

type SearchParams = Promise<{ c?: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfo();
  return seoMeta({
    title: `${info.productsPageTitle || 'Sản phẩm'} — ${info.name}`,
    description: info.productsPageSubtitle,
    canonical: '/products',
  });
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const { c } = await searchParams;
  if (c && /^[a-z0-9-]+$/.test(c)) permanentRedirect(`/danh-muc/${c}`);

  const [allCategories, allProducts, info] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
    getSiteInfo(),
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
      rootTitle={info.productsPageTitle}
      rootSubtitle={info.productsPageSubtitle}
      badge={info.listingBadge}
    />
  );
}
