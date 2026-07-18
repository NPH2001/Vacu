import type { Metadata } from 'next';

/**
 * Common metadata shape (title, description, canonical, Open Graph + Twitter).
 * Relative `canonical`/`image` paths resolve against the root layout's
 * `metadataBase` (built from the configured site URL).
 */
export function seoMeta({
  title, description, canonical, image, type = 'website',
}: {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
}): Metadata {
  const desc = description?.replace(/\s+/g, ' ').trim().slice(0, 300) || undefined;
  return {
    title,
    description: desc,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title, description: desc, url: canonical, type,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image', title, description: desc,
      images: image ? [image] : undefined,
    },
  };
}
