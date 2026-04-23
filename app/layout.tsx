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
    return {
      title: info.name,
      description: info.description,
      icons: info.faviconUrl ? { icon: info.faviconUrl } : undefined,
    };
  } catch {
    return {
      title: 'Vacu',
      description: 'Rau sạch từ nông trại tới bữa cơm gia đình',
    };
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-green-950">{children}</body>
    </html>
  );
}
