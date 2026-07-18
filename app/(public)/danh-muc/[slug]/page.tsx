// Reads searchParams for the search/sort/in-stock filters, so it renders
// dynamically (like /products) rather than ISR.
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import {
  getAllCategories, getAllProducts, getProductsByCategoryDeep, getCategory, getSiteInfo,
} from '@/lib/data';
import { getDescendantIds, getAncestors } from '@/lib/categories';
import CategoryListing from '@/components/CategoryListing';
import ProductFilters from '@/components/ProductFilters';
import { filterAndSortProducts } from '@/lib/product-filter';
import { seoMeta } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [cat, info] = await Promise.all([getCategory(slug), getSiteInfo()]);
  if (!cat) return {};
  // Title is the category name + site name — not the full description, which
  // bloats the tag and duplicates the meta description.
  return seoMeta({
    title: `${cat.name} — ${info.name}`,
    description: cat.description,
    canonical: `/danh-muc/${cat.id}`,
    image: cat.coverImage ?? undefined,
  });
}

export default async function CategoryPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; sort?: string; con?: string }>;
}) {
  const { slug } = await params;
  const { q, sort, con } = await searchParams;
  const [activeCategory, allCategories, allProducts, info] = await Promise.all([
    getCategory(slug),
    getAllCategories(),
    getAllProducts(),
    getSiteInfo(),
  ]);
  if (!activeCategory) notFound();

  const descendantIds = getDescendantIds(activeCategory.id, allCategories);
  const ancestors = getAncestors(activeCategory.id, allCategories);
  const topLevel = allCategories.filter((c) => !c.parentId);
  const inCategory = await getProductsByCategoryDeep(descendantIds);
  // Apply the same search/sort/in-stock filter the root /products page uses, so
  // a shopper can narrow a large category instead of scrolling all of it.
  const filtered = filterAndSortProducts(inCategory, { q, sort, inStockOnly: con === '1' });

  return (
    <CategoryListing
      topLevel={topLevel}
      ancestors={ancestors}
      filtered={filtered}
      allProducts={allProducts}
      activeCategory={activeCategory}
      allCategories={allCategories}
      filters={<ProductFilters resultCount={filtered.length} />}
      emptyText={q || con ? 'Không tìm thấy sản phẩm nào khớp bộ lọc trong danh mục này.' : 'Chưa có sản phẩm trong danh mục này.'}
      badge={info.listingBadge}
    />
  );
}
