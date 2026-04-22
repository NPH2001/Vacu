import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' });
const fraunces = Fraunces({ subsets: ['latin', 'vietnamese'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Nông Trại Xanh',
  description: 'Rau sạch từ nông trại tới bữa cơm gia đình',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-green-950">{children}</body>
    </html>
  );
}
