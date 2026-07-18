export const revalidate = 300; // ISR: on-demand + refreshed by admin revalidatePath, 5-min ceiling

import { notFound } from 'next/navigation';
import {
  getAllCategories, getAllProducts, getProductsByCategoryDeep, getCategory, getSiteInfo,
} from '@/lib/data';
import { getDescendantIds, getAncestors } from '@/lib/categories';
import CategoryListing from '@/components/CategoryListing';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await getCategory(slug);
  if (!cat) return {};
  return {
    title: `${cat.name} — ${cat.description}`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
  const filtered = await getProductsByCategoryDeep(descendantIds);

  return (
    <CategoryListing
      topLevel={topLevel}
      ancestors={ancestors}
      filtered={filtered}
      allProducts={allProducts}
      activeCategory={activeCategory}
      allCategories={allCategories}
      badge={info.listingBadge}
    />
  );
}
