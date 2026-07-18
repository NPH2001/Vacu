import type { MetadataRoute } from 'next';
import { getSiteInfo, getAllProducts, getAllCategories, getAllFarmers } from '@/lib/data';
import { getPublishedPosts } from '@/lib/posts';
import { getAllPages } from '@/lib/pages';
import { HOME_PAGE_ID } from '@/lib/blocks';

/** Absolute origin from the configured site URL, or '' if unset/invalid. */
function baseUrl(siteUrl: string): string {
  try {
    return siteUrl.trim() ? new URL(siteUrl.trim()).origin : '';
  } catch {
    return '';
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const info = await getSiteInfo();
    const base = baseUrl(info.siteUrl);
    // Sitemap URLs must be absolute; with no canonical URL configured, emit
    // nothing rather than wrong/relative URLs.
    if (!base) return [];

    const [products, categories, farmers, posts, pages] = await Promise.all([
      getAllProducts(), getAllCategories(), getAllFarmers(),
      getPublishedPosts({ pageSize: 1000 }), getAllPages(),
    ]);

    const entry = (path: string, lastModified?: Date): MetadataRoute.Sitemap[number] =>
      ({ url: `${base}${path}`, lastModified });

    return [
      ...['/', '/products', '/farmers', '/tin-tuc', '/contact'].map((p) => entry(p)),
      ...products.map((p) => entry(`/products/${p.id}`, p.updatedAt)),
      ...categories.filter((c) => !c.parentId).map((c) => entry(`/danh-muc/${c.id}`, c.updatedAt)),
      ...farmers.map((f) => entry(`/farmers/${f.id}`, f.updatedAt)),
      ...posts.rows.map((p) => entry(`/tin-tuc/${p.id}`, p.updatedAt ?? p.publishedAt ?? undefined)),
      ...pages
        .filter((pg) => pg.status === 'published' && pg.id !== HOME_PAGE_ID)
        .map((pg) => entry(`/${pg.id}`, pg.updatedAt)),
    ];
  } catch {
    return []; // DB unavailable (e.g. during build)
  }
}
