import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { getSiteInfo } from '@/lib/data';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' });
const fraunces = Fraunces({ subsets: ['latin', 'vietnamese'], variable: '--font-display' });

export async function generateMetadata(): Promise<Metadata> {
  // Falls back to static defaults if the DB is unavailable (e.g. during `next build`
  // in a CI/Docker context where DATABASE_URL points to nothing).
  try {
    const info = await getSiteInfo();

    // Site verification: emit a meta tag only for platforms the admin filled in.
    // Bing/Facebook use fixed meta names; Google has a first-class field.
    const otherMeta: Record<string, string> = {};
    if (info.verificationBing) otherMeta['msvalidate.01'] = info.verificationBing;
    if (info.verificationFacebook) otherMeta['facebook-domain-verification'] = info.verificationFacebook;

    return {
      // Absolute base for Open Graph / canonical URLs. Only set when a valid
      // URL is configured — an invalid metadataBase throws during render.
      metadataBase: safeUrl(info.siteUrl),
      title: info.name,
      description: info.description,
      icons: info.faviconUrl ? { icon: info.faviconUrl } : undefined,
      verification: info.verificationGoogle
        ? { google: info.verificationGoogle, ...(Object.keys(otherMeta).length ? { other: otherMeta } : {}) }
        : (Object.keys(otherMeta).length ? { other: otherMeta } : undefined),
    };
  } catch {
    return {
      title: 'Vacu',
      description: 'Rau sạch từ nông trại tới bữa cơm gia đình',
    };
  }
}

/** A malformed siteUrl must not crash every page's render. */
function safeUrl(url: string): URL | undefined {
  if (!url.trim()) return undefined;
  try {
    return new URL(url.trim());
  } catch {
    return undefined;
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-green-950">{children}</body>
    </html>
  );
}
