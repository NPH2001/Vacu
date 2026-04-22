import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/components/CartProvider";
import { OrdersProvider } from "@/components/OrdersProvider";
import CartDrawer from "@/components/CartDrawer";
import { info } from "@/lib/data";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin", "vietnamese"], variable: "--font-display" });

export const metadata: Metadata = {
  title: `${info.name} — ${info.tagline}`,
  description: info.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-green-950">
        <OrdersProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </OrdersProvider>
      </body>
    </html>
  );
}
