import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CartProvider } from '@/components/CartProvider';
import CartDrawer from '@/components/CartDrawer';
import { getSiteInfo, getAllCategories } from '@/lib/data';

export async function generateMetadata() {
  const info = await getSiteInfo();
  return { title: `${info.name} — ${info.tagline}`, description: info.description };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [info, categories] = await Promise.all([getSiteInfo(), getAllCategories()]);
  return (
    <CartProvider>
      <Navbar info={info} />
      <main className="flex-1">{children}</main>
      <Footer info={info} categories={categories} />
      <CartDrawer />
    </CartProvider>
  );
}
