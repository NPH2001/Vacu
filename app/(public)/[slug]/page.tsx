export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPublishedPage, getAnyPage } from '@/lib/pages';
import { getSiteInfo } from '@/lib/data';
import { seoMeta } from '@/lib/seo';
import { getCurrentUser } from '@/lib/session';
import { HOME_PAGE_ID } from '@/lib/blocks';
import BlockRenderer from '@/components/blocks/BlockRenderer';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Draft pages open only for a signed-in admin who asked for a preview —
 * without the session check, `?preview=1` would publish every draft to anyone
 * who guessed the URL.
 */
async function loadPage(slug: string, preview: boolean) {
  // The homepage lives under id `home` but is served at `/`; never expose it here.
  if (slug === HOME_PAGE_ID) return { page: null, previewing: false };
  if (!preview) return { page: await getPublishedPage(slug), previewing: false };
  const user = await getCurrentUser();
  if (!user) return { page: await getPublishedPage(slug), previewing: false };
  return { page: await getAnyPage(slug), previewing: true };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { page, previewing } = await loadPage(slug, sp.preview === '1');
  if (!page) return { title: 'Không tìm thấy trang' };

  const info = await getSiteInfo();
  return {
    ...seoMeta({
      title: `${page.metaTitle || page.title} — ${info.name}`,
      description: page.metaDescription || undefined,
      canonical: `/${slug}`,
    }),
    robots: previewing && page.status !== 'published' ? { index: false, follow: false } : undefined,
  };
}

export default async function DynamicPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { page, previewing } = await loadPage(slug, sp.preview === '1');

  // Any unknown URL lands here, so a miss must 404 like a normal not-found.
  if (!page) notFound();

  return (
    <div>
      {previewing && page.status !== 'published' && (
        <div className="bg-amber-400 text-green-950 text-sm font-medium px-4 py-2.5 text-center">
          👁 Đang xem thử — trang này còn là bản nháp, khách chưa nhìn thấy.{' '}
          <Link href={`/admin/pages/${page.id}`} className="underline">Sửa trang</Link>
        </div>
      )}
      {page.blocks.map((b) => <BlockRenderer key={b.id} block={b.data} />)}
    </div>
  );
}
