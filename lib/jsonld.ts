import type { SiteInfoRow, ProductRow, FarmerRow, CategoryRow } from '@/db/schema';

/** Origin of the configured site URL, or '' when unset/invalid. */
function origin(siteUrl: string): string {
  try {
    return siteUrl.trim() ? new URL(siteUrl.trim()).origin : '';
  } catch {
    return '';
  }
}
const abs = (base: string, path: string) => (/^https?:\/\//.test(path) ? path : `${base}${path}`);

export function organizationLd(info: SiteInfoRow): Record<string, unknown> {
  const base = origin(info.siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: info.name,
    ...(base && { url: base }),
    ...(info.logoUrl && { logo: abs(base, info.logoUrl) }),
    ...(info.phone && { telephone: info.phone }),
    ...(info.email && { email: info.email }),
    ...(info.address && { address: { '@type': 'PostalAddress', streetAddress: info.address } }),
  };
}

export function productLd(
  info: SiteInfoRow, p: ProductRow, farmer: FarmerRow | null, category: CategoryRow | null,
): Record<string, unknown> {
  const base = origin(info.siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    ...(p.image && { image: abs(base, p.image) }),
    ...(category && { category: category.name }),
    ...(farmer && { brand: { '@type': 'Brand', name: farmer.farm || farmer.name } }),
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'VND',
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      ...(base && { url: `${base}/products/${p.id}` }),
    },
  };
}

export function breadcrumbLd(
  info: SiteInfoRow, items: { name: string; path: string }[],
): Record<string, unknown> {
  const base = origin(info.siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(base && { item: abs(base, it.path) }),
    })),
  };
}

export function articleLd(
  info: SiteInfoRow,
  post: { title: string; excerpt: string; coverImage: string | null; publishedAt: Date | null; updatedAt: Date; authorName: string },
): Record<string, unknown> {
  const base = origin(info.siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    ...(post.excerpt && { description: post.excerpt }),
    ...(post.coverImage && { image: abs(base, post.coverImage) }),
    ...(post.publishedAt && { datePublished: post.publishedAt.toISOString() }),
    dateModified: post.updatedAt.toISOString(),
    ...(post.authorName && { author: { '@type': 'Person', name: post.authorName } }),
    publisher: {
      '@type': 'Organization',
      name: info.name,
      ...(info.logoUrl && base && { logo: { '@type': 'ImageObject', url: abs(base, info.logoUrl) } }),
    },
  };
}
