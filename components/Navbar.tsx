"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteInfoRow } from "@/db/schema";
import { useCart } from "./CartProvider";

const links = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Nông sản" },
  { href: "/farmers", label: "Nông dân" },
  { href: "/orders", label: "Đơn hàng" },
  { href: "/about", label: "Câu chuyện" },
  { href: "/contact", label: "Liên hệ" },
];

export default function Navbar({ info }: { info: SiteInfoRow }) {
  const [open, setOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-green-100">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-xl md:text-2xl font-bold text-green-800 font-display"
        >
          {info.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.logoUrl} alt={info.name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-700 text-white text-lg">🌱</span>
          )}
          {info.name}
        </Link>

        <ul className="hidden lg:flex gap-7 text-sm font-medium text-green-900/80">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-green-700 transition">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Giỏ hàng"
            className="relative w-11 h-11 rounded-full hover:bg-green-50 text-green-900 flex items-center justify-center text-xl"
          >
            🧺
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          <Link
            href="/products"
            className="hidden md:inline-block bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition"
          >
            Mua nông sản →
          </Link>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 -mr-2 text-green-900"
          >
            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <>
                  <line x1="6" y1="6" x2="22" y2="22" />
                  <line x1="22" y1="6" x2="6" y2="22" />
                </>
              ) : (
                <>
                  <line x1="4" y1="8" x2="24" y2="8" />
                  <line x1="4" y1="14" x2="24" y2="14" />
                  <line x1="4" y1="20" x2="24" y2="20" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-green-100 bg-white">
          <ul className="px-4 py-4 space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-3 rounded-lg text-green-900 hover:bg-green-50 font-medium"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
