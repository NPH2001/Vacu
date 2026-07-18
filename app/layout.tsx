import type { Metadata } from 'next';
import { Inter, Fraunces, Be_Vietnam_Pro, Playfair_Display } from 'next/font/google';
import { getSiteInfo, getTheme } from '@/lib/data';
import { generateThemeCss } from '@/lib/theme';
import './globals.css';

// The theme picks among these by key (see FONT_VARS in lib/theme.ts). All are
// loaded so switching fonts in the admin needs no rebuild — but only the
// default pair (Inter + Fraunces, see DEFAULT_THEME) is <link rel=preload>ed.
// The other two set `preload: false`: they still load if the admin selects
// them, they just don't compete for first-load bandwidth on the default theme
// (each carries a large Vietnamese glyph set).
const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });
const fraunces = Fraunces({ subsets: ['latin', 'vietnamese'], variable: '--font-fraunces' });
const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'], weight: ['400', '500', '600', '700'], variable: '--font-be-vietnam', preload: false,
});
const playfair = Playfair_Display({ subsets: ['latin', 'vietnamese'], variable: '--font-playfair', preload: false });

const fontVars = `${inter.variable} ${fraunces.variable} ${beVietnam.variable} ${playfair.variable}`;

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
      // Default social card, inherited by pages that don't set their own image.
      openGraph: {
        siteName: info.name,
        type: 'website',
        images: info.logoUrl ? [info.logoUrl] : undefined,
      },
      twitter: { card: 'summary_large_image' },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Admin-configurable theme: overrides the green/amber ramps, radius and fonts
  // at :root, so the whole site (and the console) recolours with no rebuild.
  const themeCss = generateThemeCss(await getTheme());

  return (
    <html lang="vi" className={`${fontVars} h-full antialiased`}>
      <head>
        <style id="theme-vars" dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="min-h-full flex flex-col font-sans text-green-950">{children}</body>
    </html>
  );
}
