export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublishedPosts, getPostCategoriesWithCounts, getLatestPosts } from '@/lib/posts';
import { getSiteInfo } from '@/lib/data';
import { seoMeta } from '@/lib/seo';
import { formatDate } from '@/lib/format';
import AnimateOnScroll from '@/components/AnimateOnScroll';
import NewsSidebar from '@/components/NewsSidebar';

const PAGE_SIZE = 9;

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [info, sp] = await Promise.all([getSiteInfo(), searchParams]);
  const category = typeof sp['chuyen-muc'] === 'string' ? sp['chuyen-muc'] : undefined;
  const searching = typeof sp.q === 'string' && sp.q.trim() !== '';
  const paged = typeof sp.trang === 'string' && sp.trang !== '1';
  // Canonical folds all the infinite ?q=/?trang= variants back to a single
  // indexable URL (category kept, search/page dropped); free-text search and
  // pages past the first are noindex'd so they don't burn crawl budget.
  return {
    ...seoMeta({
      title: `Tin tức — ${info.name}`,
      description: `Tin tức, mẹo hay và câu chuyện nông trại từ ${info.name}.`,
      canonical: category ? `/tin-tuc?chuyen-muc=${encodeURIComponent(category)}` : '/tin-tuc',
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
  const categoryId = typeof sp['chuyen-muc'] === 'string' ? sp['chuyen-muc'] : undefined;
  const q = typeof sp.q === 'string' ? sp.q : undefined;
  const page = Math.max(1, Number(typeof sp.trang === 'string' ? sp.trang : '1') || 1);

  const [{ rows, total, totalPages }, cats, latest, info] = await Promise.all([
    getPublishedPosts({ categoryId, page, pageSize: PAGE_SIZE, q }),
    getPostCategoriesWithCounts(),
    getLatestPosts(5),
    getSiteInfo(),
  ]);

  const activeCat = cats.find((c) => c.id === categoryId);

  const href = (params: { cat?: string; p?: number }) => {
    const qs = new URLSearchParams();
    const cat = params.cat !== undefined ? params.cat : categoryId;
    if (cat) qs.set('chuyen-muc', cat);
    if (q) qs.set('q', q);
    const p = params.p ?? 1;
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
            {activeCat ? activeCat.name : info.newsTitle}
          </h1>
          <p className="text-green-900/70 mt-3 max-w-xl mx-auto wrap-anywhere">
            {activeCat?.description || info.newsSubtitle}
          </p>
        </div>
      </section>

      {/* Category pills — mobile/tablet only. On desktop the sidebar carries
          category navigation, so this bar is hidden to avoid duplication. */}
      {cats.length > 0 && (
        // top-[72px] clears the sticky navbar (z-50, ~72px) so this pill bar isn't hidden behind it while scrolling
        <div className="lg:hidden border-b border-green-100 bg-white/60 sticky top-[72px] z-20 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar">
            <Link href={href({ cat: '' })}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                !categoryId ? 'bg-green-700 text-white' : 'bg-green-50 text-green-900 hover:bg-green-100'
              }`}>
              Tất cả
            </Link>
            {cats.map((c) => (
              <Link key={c.id} href={href({ cat: c.id })}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                  categoryId === c.id ? 'bg-green-700 text-white' : 'bg-green-50 text-green-900 hover:bg-green-100'
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
            <p className="text-green-900/70">
              {q || categoryId ? 'Chưa có bài viết nào phù hợp.' : 'Chưa có bài viết nào. Ghé lại sau nhé!'}
            </p>
            {(q || categoryId) && (
              <Link href="/tin-tuc" className="inline-block mt-4 text-green-700 hover:underline">
                ← Xem tất cả bài viết
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-6">
              {rows.map((p) => (
                <AnimateOnScroll key={p.id}>
                  <Link href={`/tin-tuc/${p.id}`}
                    className="group block bg-white rounded-3xl border border-green-100 overflow-hidden shadow-[0_1px_3px_rgba(20,60,30,0.05)] hover:border-green-300 hover:shadow-[0_16px_32px_-12px_rgba(20,83,45,0.22)] hover:-translate-y-1 transition duration-300 h-full">
                    <div className="aspect-[16/10] bg-green-50 overflow-hidden relative">
                      {p.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImage} alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🌿</div>
                      )}
                      {p.featured && (
                        <span className="absolute top-3 left-3 bg-amber-400 text-green-950 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          Nổi bật
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-[12px] text-green-900/50 mb-2">
                        {p.categoryName && (
                          <>
                            <span className="text-green-700 font-medium">{p.categoryName}</span>
                            <span>·</span>
                          </>
                        )}
                        <time dateTime={p.publishedAt ? new Date(p.publishedAt).toISOString() : undefined}>
                          {formatDate(p.publishedAt)}
                        </time>
                      </div>
                      <h2 className="font-display text-xl font-bold text-green-950 leading-snug group-hover:text-green-700 transition line-clamp-2">
                        {p.title}
                      </h2>
                      {p.excerpt && (
                        <p className="text-sm text-green-900/70 mt-2 line-clamp-3">{p.excerpt}</p>
                      )}
                    </div>
                  </Link>
                </AnimateOnScroll>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                {page > 1 && (
                  <Link href={href({ p: page - 1 })}
                    className="px-4 py-2 rounded-full border border-green-200 text-sm text-green-900 hover:bg-green-50">
                    ← Trước
                  </Link>
                )}
                <span className="text-sm text-green-900/60">Trang {page}/{totalPages}</span>
                {page < totalPages && (
                  <Link href={href({ p: page + 1 })}
                    className="px-4 py-2 rounded-full border border-green-200 text-sm text-green-900 hover:bg-green-50">
                    Sau →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
        </div>

        <aside className="hidden lg:block">
          <NewsSidebar latest={latest} categories={cats} activeCategoryId={categoryId} q={q ?? ''} />
        </aside>
       </div>
      </section>
    </div>
  );
}
