export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPosts, getPostCategoriesWithCounts, getLatestPosts } from '@/lib/posts';
import { getSiteInfo } from '@/lib/data';
import { seoMeta } from '@/lib/seo';
import NewsSidebar from '@/components/NewsSidebar';
import NewsListing from '@/components/NewsListing';

const PAGE_SIZE = 9;

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [info, sp] = await Promise.all([getSiteInfo(), searchParams]);
  const searching = typeof sp.q === 'string' && sp.q.trim() !== '';
  const paged = typeof sp.trang === 'string' && sp.trang !== '1';
  // Canonical folds all the infinite ?q=/?trang= variants back to a single
  // indexable URL; free-text search and pages past the first are noindex'd so
  // they don't burn crawl budget. Per-category pages live at /danh-muc-tin-tuc.
  return {
    ...seoMeta({
      title: `Tin tức — ${info.name}`,
      description: `Tin tức, mẹo hay và câu chuyện nông trại từ ${info.name}.`,
      canonical: '/tin-tuc',
    }),
    robots: searching || paged ? { index: false, follow: true } : undefined,
  };
}


export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  // Back-compat: old category links used ?chuyen-muc=<id>. Send them to the
  // canonical path route so the query form isn't used anywhere.
  const legacyCat = typeof sp['chuyen-muc'] === 'string' ? sp['chuyen-muc'] : undefined;
  if (legacyCat) redirect(`/danh-muc-tin-tuc/${encodeURIComponent(legacyCat)}`);

  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const page = Math.max(1, Number(typeof sp.trang === 'string' ? sp.trang : '1') || 1);

  const [{ rows, total, totalPages }, cats, latest, info] = await Promise.all([
    getPublishedPosts({ page, pageSize: PAGE_SIZE, q }),
    getPostCategoriesWithCounts(),
    getLatestPosts(5),
    getSiteInfo(),
  ]);

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    if (p > 1) qs.set('trang', String(p));
    const s = qs.toString();
    return s ? `/tin-tuc?${s}` : '/tin-tuc';
  };

  return (
    <div>
      <section className="bg-green-50/60 texture-paper border-b border-green-100">
        <div className="max-w-6xl mx-auto px-4 py-14 text-center">
          <div className="text-amber-600 text-sm font-bold tracking-widest uppercase mb-2">Tin tức</div>
          <h1 className="text-4xl md:text-5xl font-bold text-green-950 font-display wrap-anywhere">
            {info.newsTitle}
          </h1>
          <p className="text-green-900/70 mt-3 max-w-xl mx-auto wrap-anywhere">
            {info.newsSubtitle}
          </p>
        </div>
      </section>

      {/* Category pills — mobile/tablet only. On desktop the sidebar carries
          category navigation, so this bar is hidden to avoid duplication. */}
      {cats.length > 0 && (
        // top-[72px] clears the sticky navbar (z-50, ~72px) so this pill bar isn't hidden behind it while scrolling
        <div className="lg:hidden border-b border-green-100 bg-white/60 sticky top-[72px] z-20 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
            <Link href="/tin-tuc"
              className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition bg-green-700 text-white">
              Tất cả
            </Link>
            {cats.map((c) => (
              <Link key={c.id} href={`/danh-muc-tin-tuc/${c.id}`}
                className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition bg-green-50 text-green-900 hover:bg-green-100">
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
            <p className="text-green-900/70">
              {q ? 'Chưa có bài viết nào phù hợp.' : 'Chưa có bài viết nào. Ghé lại sau nhé!'}
            </p>
            {q && (
              <Link href="/tin-tuc" className="inline-block mt-4 text-green-700 hover:underline">
                ← Xem tất cả bài viết
              </Link>
            )}
          </div>
        ) : (
          <NewsListing rows={rows} page={page} totalPages={totalPages} pageHref={pageHref} />
        )}
        </div>

        <aside className="hidden lg:block">
          <NewsSidebar latest={latest} categories={cats} q={q ?? ''} />
        </aside>
       </div>
      </section>
    </div>
  );
}
