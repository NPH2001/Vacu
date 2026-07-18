export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getPublishedPage, getAnyPage, type LoadedBlock } from '@/lib/pages';
import { getCurrentUser } from '@/lib/session';
import { getSiteInfo } from '@/lib/data';
import { seoMeta } from '@/lib/seo';
import { HOME_PAGE_ID } from '@/lib/blocks';
import { DEFAULT_HOME_BLOCKS } from '@/lib/home-blocks';
import BlockRenderer from '@/components/blocks/BlockRenderer';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const [page, info] = await Promise.all([getPublishedPage(HOME_PAGE_ID), getSiteInfo()]);
  return seoMeta({
    title: page?.metaTitle || info.name,
    description: page?.metaDescription || info.description,
    canonical: '/',
  });
}

/**
 * The homepage is a page-builder page (row id `home`, served here at `/`) so it
 * is edited in the same builder as every other page. Until that row is seeded —
 * or if it is ever missing — we fall back to the default block layout so `/`
 * always renders.
 */
export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const previewing = sp.preview === '1' && Boolean(await getCurrentUser());
  const page = previewing
    ? await getAnyPage(HOME_PAGE_ID)
    : await getPublishedPage(HOME_PAGE_ID);

  const blocks: LoadedBlock[] = page
    ? page.blocks
    : DEFAULT_HOME_BLOCKS
        .filter((b) => b.visible)
        .map((b, i) => ({ id: i, visible: true, data: b.data }));

  return (
    <div>
      {blocks.map((b) => <BlockRenderer key={b.id} block={b.data} />)}
    </div>
  );
}
