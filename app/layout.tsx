import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { getSiteInfo } from '@/lib/data';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' });
const fraunces = Fraunces({ subsets: ['latin', 'vietnamese'], variable: '--font-display' });

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteInfo();
  return {
    title: info.name,
    description: info.description,
    icons: info.faviconUrl ? { icon: info.faviconUrl } : undefined,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-green-950">{children}</body>
    </html>
  );
}
