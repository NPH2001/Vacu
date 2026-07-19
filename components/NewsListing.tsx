import Link from 'next/link';
import type { PostWithCategory } from '@/lib/posts';
import { formatDate } from '@/lib/format';
import AnimateOnScroll from '@/components/AnimateOnScroll';

/**
 * The post-card grid + pagination, shared by the news index (/tin-tuc) and the
 * per-category page (/danh-muc-tin-tuc/[id]). Only the pagination target differs,
 * so the caller passes `pageHref`.
 */
export default function NewsListing({
  rows, page, totalPages, pageHref,
}: {
  rows: PostWithCategory[];
  page: number;
  totalPages: number;
  pageHref: (p: number) => string;
}) {
  return (
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
            <Link href={pageHref(page - 1)}
              className="px-4 py-2 rounded-full border border-green-200 text-sm text-green-900 hover:bg-green-50">
              ← Trước
            </Link>
          )}
          <span className="text-sm text-green-900/60">Trang {page}/{totalPages}</span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)}
              className="px-4 py-2 rounded-full border border-green-200 text-sm text-green-900 hover:bg-green-50">
              Sau →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
