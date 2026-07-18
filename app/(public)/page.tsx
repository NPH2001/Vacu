export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getPublishedPage, getAnyPage, primaryHeroIndex, type LoadedBlock } from '@/lib/pages';
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
 * is edited in the same builder as every other page. We fall back to the default
 * block layout whenever the row is missing OR has no visible blocks (an admin
 * removed/hid them all), so `/` is never a blank page.
 */
export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const previewing = sp.preview === '1' && Boolean(await getCurrentUser());
  const page = previewing
    ? await getAnyPage(HOME_PAGE_ID)
    : await getPublishedPage(HOME_PAGE_ID);

  const fallback: LoadedBlock[] = DEFAULT_HOME_BLOCKS
    .filter((b) => b.visible)
    .map((b, i) => ({ id: i, visible: true, data: b.data }));

  // page?.blocks already has hidden blocks stripped; an empty result means the
  // homepage would render blank, so use the default layout instead.
  const blocks: LoadedBlock[] = page && page.blocks.length > 0 ? page.blocks : fallback;
  const primary = primaryHeroIndex(blocks);
  const info = primary === -1 ? await getSiteInfo() : null;

  return (
    <div>
      {/* Guarantee exactly one <h1>: if no hero carries it, add a hidden one. */}
      {primary === -1 && <h1 className="sr-only">{info!.name}</h1>}
      {blocks.map((b, i) => (
        <BlockRenderer key={b.id} block={b.data} heading={i === primary ? 'h1' : 'h2'} />
      ))}
    </div>
  );
}
