import type { MetadataRoute } from 'next';
import { getSiteInfo } from '@/lib/data';

export default async function robots(): Promise<MetadataRoute.Robots> {
  let base = '';
  try {
    const url = (await getSiteInfo()).siteUrl.trim();
    if (url) base = new URL(url).origin;
  } catch {
    // DB unavailable during build — omit the sitemap/host hints.
  }

  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      // Account/checkout and every admin/API surface must stay out of the index.
      disallow: ['/admin', '/api', '/checkout', '/orders'],
    }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
    host: base || undefined,
  };
}
