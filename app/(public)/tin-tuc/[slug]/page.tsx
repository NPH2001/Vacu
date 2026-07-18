export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPost, getAnyPost, getRelatedPosts, getLatestPosts, getPostCategoriesWithCounts } from '@/lib/posts';
import { getSiteInfo } from '@/lib/data';
import { seoMeta } from '@/lib/seo';
import { formatDateLong as formatDate } from '@/lib/format';
import { getCurrentUser } from '@/lib/session';
import { articleLd } from '@/lib/jsonld';
import JsonLd from '@/components/JsonLd';
import NewsSidebar from '@/components/NewsSidebar';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Drafts and scheduled posts are fetched only for a signed-in admin who asked
 * for a preview. Without the session check, `?preview=1` would be a public
 * bypass of the publish schedule.
 */
async function loadPost(slug: string, preview: boolean) {
  if (!preview) return { post: await getPublishedPost(slug), previewing: false };
  const user = await getCurrentUser();
  if (!user) return { post: await getPublishedPost(slug), previewing: false };
  return { post: await getAnyPost(slug), previewing: true };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { post, previewing } = await loadPost(slug, sp.preview === '1');
  if (!post) return { title: 'Không tìm thấy bài viết' };

  const info = await getSiteInfo();
  // "Live" = published AND its publish time has arrived. A scheduled post is
  // status='published' with a future date, so checking status alone would let a
  // previewed scheduled post be indexed — mirror the public visibility rule.
  const isLive = post.status === 'published'
    && !!post.publishedAt && new Date(post.publishedAt) <= new Date();
  return {
    ...seoMeta({
      title: `${post.metaTitle || post.title} — ${info.name}`,
      description: post.metaDescription || post.excerpt,
      canonical: `/tin-tuc/${slug}`,
      image: post.coverImage ?? undefined,
      type: 'article',
    }),
    // An unpublished/scheduled preview must never be indexed if the URL is shared.
    robots: previewing && !isLive ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      url: `/tin-tuc/${slug}`,
      type: 'article',
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}


/** Rough reading time: strip tags, count words, ~200 wpm, floor of 1. */
function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default async function PostDetailPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { post, previewing } = await loadPost(slug, sp.preview === '1');
  if (!post) notFound();

  const [related, latestRaw, categories, info] = await Promise.all([
    getRelatedPosts(post),
    getLatestPosts(6),
    getPostCategoriesWithCounts(),
    getSiteInfo(),
  ]);
  // Don't list the article you're reading in its own "latest" sidebar.
  const latest = latestRaw.filter((p) => p.id !== post.id).slice(0, 5);
  const isLive = post.status === 'published' && post.publishedAt && new Date(post.publishedAt) <= new Date();

  return (
    <div>
      {isLive && <JsonLd data={articleLd(info, post)} />}
      {previewing && !isLive && (
        <div className="bg-amber-400 text-green-950 text-sm font-medium px-4 py-2.5 text-center">
          👁 Đang xem thử — bài này {post.status === 'draft' ? 'còn là bản nháp' : 'đã hẹn giờ đăng'}, khách chưa nhìn thấy.{' '}
          <Link href={`/admin/posts/${post.id}`} className="underline">Sửa bài</Link>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-10">
        <nav className="text-sm text-green-900/60 mb-6 wrap-anywhere">
          <Link href="/" className="hover:underline">Trang chủ</Link> /{' '}
          <Link href="/tin-tuc" className="hover:underline">Tin tức</Link>
          {post.categoryName && (
            <>
              {' / '}
              <Link href={`/tin-tuc?chuyen-muc=${post.categoryId}`} className="hover:underline">
                {post.categoryName}
              </Link>
            </>
          )}
        </nav>

        {/* min-w-0 keeps the long prose column from pushing the sidebar wider. */}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12 items-start">
          <article className="min-w-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-950 font-display leading-tight wrap-anywhere">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-green-900/60 mt-5">
              {post.authorName && <span>Bởi <b className="text-green-900">{post.authorName}</b></span>}
              {post.publishedAt && (
                <>
                  <span>·</span>
                  <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDate(post.publishedAt)}</time>
                </>
              )}
              <span>·</span>
              <span>{readingMinutes(post.contentHtml)} phút đọc</span>
            </div>

            {post.coverImage && (
              <div className="mt-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.coverImage} alt={post.title}
                  className="w-full rounded-3xl object-cover max-h-[460px]" />
              </div>
            )}

            {post.excerpt && (
              <p className="text-lg text-green-900/80 leading-relaxed border-l-4 border-green-200 pl-4 italic mt-8">
                {post.excerpt}
              </p>
            )}

            {/* Sanitized on write in actions/posts.ts via sanitizeRichText. */}
            <div className="product-prose mt-8"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

            {post.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-green-100 flex flex-wrap items-center gap-2">
                <span className="text-sm text-green-900/50 mr-1">Chủ đề:</span>
                {post.tags.map((t) => (
                  <span key={t} className="bg-green-50 hover:bg-green-100 text-green-800 text-[13px] font-medium px-3 py-1.5 rounded-full border border-green-200/70 transition wrap-anywhere">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </article>

          <aside className="lg:pt-2">
            <NewsSidebar
              latest={latest}
              categories={categories}
              activeCategoryId={post.categoryId ?? undefined}
            />
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-green-50/60 texture-paper mt-16 py-14">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-green-950 font-display text-center mb-8 wrap-anywhere">
              {info.relatedPostsHeading}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link key={r.id} href={`/tin-tuc/${r.id}`}
                  className="group bg-white rounded-3xl border border-green-100 overflow-hidden hover:border-green-300 transition">
                  <div className="aspect-[16/10] bg-green-50 overflow-hidden">
                    {r.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverImage} alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display font-bold text-green-950 leading-snug line-clamp-2 group-hover:text-green-700 transition">
                      {r.title}
                    </h3>
                    <div className="text-[12px] text-green-900/50 mt-1.5">{formatDate(r.publishedAt)}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/tin-tuc"
                className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold px-7 py-3 rounded-full transition">
                Xem tất cả tin tức →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
