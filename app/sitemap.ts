import type { MetadataRoute } from 'next';
import { getSiteInfo, getAllProducts, getAllCategories, getAllFarmers } from '@/lib/data';
import { getPublishedPosts, getPostCategoriesWithCounts } from '@/lib/posts';
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

/**
 * Every live post, not just the first page — getPublishedPosts is paginated, so
 * a single call would silently cap the sitemap at one page's worth of posts.
 */
async function getAllPublishedPosts() {
  const pageSize = 1000;
  const first = await getPublishedPosts({ pageSize, page: 1 });
  const rows = [...first.rows];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await getPublishedPosts({ pageSize, page });
    rows.push(...next.rows);
  }
  return rows;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const info = await getSiteInfo();
    const base = baseUrl(info.siteUrl);
    // Sitemap URLs must be absolute; with no canonical URL configured, emit
    // nothing rather than wrong/relative URLs.
    if (!base) return [];

    const [products, categories, farmers, posts, postCats, pages] = await Promise.all([
      getAllProducts(), getAllCategories(), getAllFarmers(),
      getAllPublishedPosts(), getPostCategoriesWithCounts(), getAllPages(),
    ]);

    const entry = (path: string, lastModified?: Date): MetadataRoute.Sitemap[number] =>
      ({ url: `${base}${path}`, lastModified });

    return [
      ...['/', '/products', '/farmers', '/tin-tuc', '/contact'].map((p) => entry(p)),
      ...products.map((p) => entry(`/products/${p.id}`, p.updatedAt)),
      // Include child categories too — they have real pages linked from
      // breadcrumbs/nav, they just aren't top-level.
      ...categories.map((c) => entry(`/danh-muc/${c.id}`, c.updatedAt)),
      ...farmers.map((f) => entry(`/farmers/${f.id}`, f.updatedAt)),
      ...posts.map((p) => entry(`/tin-tuc/${p.id}`, p.updatedAt ?? p.publishedAt ?? undefined)),
      // News category pages (path-based, not ?chuyen-muc=): only those with ≥1 live post.
      ...postCats.map((c) => entry(`/danh-muc-tin-tuc/${c.id}`)),
      ...pages
        .filter((pg) => pg.status === 'published' && pg.id !== HOME_PAGE_ID)
        .map((pg) => entry(`/${pg.id}`, pg.updatedAt)),
    ];
  } catch {
    return []; // DB unavailable (e.g. during build)
  }
}
