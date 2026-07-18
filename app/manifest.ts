import type { MetadataRoute } from 'next';
import { getSiteInfo } from '@/lib/data';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = 'Vacu';
  let shortName = 'Vacu';
  let description = 'Sản vật OCOP từ hợp tác xã Việt Nam';
  // The old /android-chrome-*.png files were removed, so point the PWA icon at
  // the admin's uploaded logo/favicon, falling back to the built-in favicon
  // that Next always serves at /favicon.ico. `sizes: 'any'` because uploads
  // have no fixed dimensions.
  let iconSrc = '/favicon.ico';
  try {
    const info = await getSiteInfo();
    name = info.name;
    shortName = info.shortName || info.name;
    description = info.description;
    iconSrc = info.logoUrl || info.faviconUrl || '/favicon.ico';
  } catch {
    // DB unavailable (e.g. during build) — fall through to defaults.
  }
  return {
    name,
    short_name: shortName,
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#166534',
    icons: [{ src: iconSrc, sizes: 'any' }],
  };
}
