export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import {
  getAllCategories, getAllProducts, getProductsByCategoryDeep, getCategory,
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
  const [activeCategory, allCategories, allProducts] = await Promise.all([
    getCategory(slug),
    getAllCategories(),
    getAllProducts(),
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
    />
  );
}
