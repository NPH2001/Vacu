import type { MetadataRoute } from 'next';
import { getSiteInfo } from '@/lib/data';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = 'Vacu';
  let shortName = 'Vacu';
  let description = 'Sản vật OCOP từ hợp tác xã Việt Nam';
  try {
    const info = await getSiteInfo();
    name = info.name;
    shortName = info.shortName || info.name;
    description = info.description;
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
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
