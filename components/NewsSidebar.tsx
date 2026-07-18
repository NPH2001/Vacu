import Link from 'next/link';
import type { PostWithCategory } from '@/lib/posts';

type CategoryCount = { id: string; name: string; count: number };

function fmtDate(d: Date | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Right-hand column for the news pages. Each block is optional so the list and
 * detail pages can show different combinations without a separate component.
 * Sticky from `lg` up; stacks under the content on smaller screens.
 */
export default function NewsSidebar({
  latest, categories, activeCategoryId, showSearch = true, q = '',
}: {
  latest: PostWithCategory[];
  categories?: CategoryCount[];
  activeCategoryId?: string;
  showSearch?: boolean;
  q?: string;
}) {
  return (
    <div className="space-y-6 lg:sticky lg:top-6">
      {showSearch && (
        <form action="/tin-tuc" method="get" className="relative">
          <input
            name="q"
            defaultValue={q}
            placeholder="Tìm bài viết…"
            aria-label="Tìm bài viết"
            className="w-full rounded-full border border-green-200 bg-white pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
          <button type="submit" aria-label="Tìm"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-700 hover:bg-green-800 text-white flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
        </form>
      )}

      {categories && categories.length > 0 && (
        <section className="bg-white rounded-2xl border border-green-100 p-5">
          <h3 className="font-display font-bold text-green-950 mb-3">Chuyên mục</h3>
          <ul className="space-y-1">
            <li>
              <Link href="/tin-tuc"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                  !activeCategoryId ? 'bg-green-700 text-white' : 'text-green-900 hover:bg-green-50'
                }`}>
                <span>Tất cả</span>
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/tin-tuc?chuyen-muc=${c.id}`}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition ${
                    activeCategoryId === c.id ? 'bg-green-700 text-white' : 'text-green-900 hover:bg-green-50'
                  }`}>
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className={`shrink-0 text-xs tabular-nums ${activeCategoryId === c.id ? 'text-green-100' : 'text-green-900/40'}`}>
                    {c.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {latest.length > 0 && (
        <section className="bg-white rounded-2xl border border-green-100 p-5">
          <h3 className="font-display font-bold text-green-950 mb-3">Bài mới nhất</h3>
          <ul className="space-y-4">
            {latest.map((p) => (
              <li key={p.id}>
                <Link href={`/tin-tuc/${p.id}`} className="group flex gap-3 items-start">
                  <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-green-50">
                    {p.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImage} alt="" loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold text-green-950 leading-snug line-clamp-2 group-hover:text-green-700 transition">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-green-900/50 mt-1">{fmtDate(p.publishedAt)}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
