export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getPublishedPosts, getPostCategoriesWithCounts, getLatestPosts, getPostCategory,
} from '@/lib/posts';
import { getSiteInfo } from '@/lib/data';
import { seoMeta } from '@/lib/seo';
import NewsSidebar from '@/components/NewsSidebar';
import NewsListing from '@/components/NewsListing';

const PAGE_SIZE = 9;

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [{ slug }, sp, info] = await Promise.all([params, searchParams, getSiteInfo()]);
  const cat = await getPostCategory(slug);
  if (!cat) return {};
  const paged = typeof sp.trang === 'string' && sp.trang !== '1';
  return {
    ...seoMeta({
      title: `${cat.name} — Tin tức — ${info.name}`,
      description: cat.description || `Tin tức thuộc chuyên mục ${cat.name} từ ${info.name}.`,
      canonical: `/danh-muc-tin-tuc/${cat.id}`,
    }),
    // Pages past the first are noindex'd so they don't burn crawl budget.
    robots: paged ? { index: false, follow: true } : undefined,
  };
}

export default async function NewsCategoryPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const page = Math.max(1, Number(typeof sp.trang === 'string' ? sp.trang : '1') || 1);

  const [category, { rows, total, totalPages }, cats, latest] = await Promise.all([
    getPostCategory(slug),
    getPublishedPosts({ categoryId: slug, page, pageSize: PAGE_SIZE }),
    getPostCategoriesWithCounts(),
    getLatestPosts(5),
  ]);
  if (!category) notFound();

  const pageHref = (p: number) =>
    p > 1 ? `/danh-muc-tin-tuc/${category.id}?trang=${p}` : `/danh-muc-tin-tuc/${category.id}`;

  return (
    <div>
      <section className="bg-green-50/60 texture-paper border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <div className="text-amber-600 text-sm font-bold tracking-widest uppercase mb-2">Tin tức</div>
          <h1 className="text-4xl md:text-5xl font-bold text-green-950 font-display wrap-anywhere">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-green-900/70 mt-3 max-w-xl mx-auto wrap-anywhere">
              {category.description}
            </p>
          )}
        </div>
      </section>

      {/* Category pills — mobile/tablet only (sidebar carries this on desktop). */}
      {cats.length > 0 && (
        <div className="lg:hidden border-b border-green-100 bg-white/60 sticky top-[72px] z-20 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
            <Link href="/tin-tuc"
              className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition bg-green-50 text-green-900 hover:bg-green-100">
              Tất cả
            </Link>
            {cats.map((c) => (
              <Link key={c.id} href={`/danh-muc-tin-tuc/${c.id}`}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                  c.id === category.id ? 'bg-green-700 text-white' : 'bg-green-50 text-green-900 hover:bg-green-100'
                }`}>
                {c.name} <span className="opacity-60">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <section className="max-w-6xl mx-auto px-4 py-12">
       <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-8 lg:gap-10 items-start">
        <div className="min-w-0">
        {total === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🌾</div>
            <p className="text-green-900/70">Chưa có bài viết nào trong chuyên mục này.</p>
            <Link href="/tin-tuc" className="inline-block mt-4 text-green-700 hover:underline">
              ← Xem tất cả bài viết
            </Link>
          </div>
        ) : (
          <NewsListing rows={rows} page={page} totalPages={totalPages} pageHref={pageHref} />
        )}
        </div>

        <aside className="hidden lg:block">
          <NewsSidebar latest={latest} categories={cats} activeCategoryId={category.id} />
        </aside>
       </div>
      </section>
    </div>
  );
}
