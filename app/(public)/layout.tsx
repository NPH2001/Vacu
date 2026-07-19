// No force-dynamic here: it would cascade dynamic rendering onto every public
// route and defeat the per-page ISR below. Pages that need per-request data keep
// their own `force-dynamic`; content detail pages opt into ISR via `revalidate`.

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/components/CartProvider';
import CartDrawer from '@/components/CartDrawer';
import ScrollToTop from '@/components/ScrollToTop';
import Analytics from '@/components/Analytics';
import JsonLd from '@/components/JsonLd';
import { organizationLd } from '@/lib/jsonld';
import { getSiteInfo, getAllCategories, getMenu } from '@/lib/data';
import { headers } from 'next/headers';

export async function generateMetadata() {
  const info = await getSiteInfo();
  return { title: `${info.name} — ${info.tagline}`, description: info.description };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [info, categories, headerMenu, footerMenu] = await Promise.all([
    getSiteInfo(),
    getAllCategories(),
    getMenu('header'),
    getMenu('footer'),
  ]);
  // Nonce minted per-request by proxy.ts; GA's inline <Script> needs it to run
  // under the strict-dynamic CSP.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <CartProvider>
      <JsonLd data={organizationLd(info)} />
      <a href="#main" className="skip-link">Bỏ qua tới nội dung</a>
      {/* Navbar is a Client Component: pass only the fields it renders, never the
          whole row, or secrets in `info` (smtpPass, …) end up in the RSC payload
          embedded in the public HTML. */}
      <Navbar info={{ logoUrl: info.logoUrl, name: info.name, navbarCta: info.navbarCta }} items={headerMenu} />
      <main id="main" className="flex-1">{children}</main>
      <Footer info={info} categories={categories} quickLinks={footerMenu} />
      <CartDrawer
        emptyTitle={info.cartEmptyTitle}
        emptyText={info.cartEmptyText}
        shippingLabel={info.shippingLabel}
      />
      <ScrollToTop />
      <Analytics measurementId={info.gaMeasurementId} nonce={nonce} />
    </CartProvider>
  );
}
