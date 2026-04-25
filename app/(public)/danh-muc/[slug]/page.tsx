export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import {
  getAllCategories, getAllProducts, getProductsByCategory, getCategory,
} from '@/lib/data';
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
  const [activeCategory, categories, allProducts, filtered] = await Promise.all([
    getCategory(slug),
    getAllCategories(),
    getAllProducts(),
    getProductsByCategory(slug),
  ]);
  if (!activeCategory) notFound();
  return (
    <CategoryListing
      categories={categories}
      allProducts={allProducts}
      filtered={filtered}
      activeCategory={activeCategory}
    />
  );
}
