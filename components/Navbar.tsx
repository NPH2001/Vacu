"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MenuItemRow } from "@/db/schema";
import { useCart } from "./CartProvider";
import PriorityNav from "./PriorityNav";

// A narrowed view of site_info — NOT the whole SiteInfoRow. This is a Client
// Component, so every prop is serialized into the RSC payload embedded in the
// public HTML; handing it the full row would leak smtpPass and other secrets to
// anyone who views source. Only the fields actually rendered are accepted.
type NavbarInfo = { logoUrl: string | null; name: string; navbarCta: string };

export default function Navbar({ info, items }: { info: NavbarInfo; items: MenuItemRow[] }) {
  const [open, setOpen] = useState(false);
  const { count, setOpen: setCartOpen } = useCart();

  // Let keyboard users dismiss the open mobile menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-green-100">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        {/* min-w-0 lets a long site name shrink instead of shoving the cart and
            CTA off the right edge. */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 text-xl md:text-2xl font-bold text-green-800 font-display min-w-0"
        >
          {info.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.logoUrl} alt={info.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-700 text-white text-lg shrink-0">🌱</span>
          )}
          {/* Wraps at spaces like any name; wrap-anywhere only kicks in for a
              name with no spaces, which would otherwise widen the bar. */}
          <span className="wrap-anywhere">{info.name}</span>
        </Link>

        {/* Priority nav: fits as many links as the space allows on one line and
            folds the rest into a "Thêm ▾" dropdown, so the bar stays one row no
            matter how many items the admin adds. */}
        {items.length > 0 && <PriorityNav items={items} />}

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Giỏ hàng"
            className="relative w-11 h-11 rounded-full hover:bg-green-50 text-green-900 flex items-center justify-center text-xl"
          >
            🧺
            {count > 0 && (
              // A fixed 20px circle can't hold 3 digits — clamp rather than
              // let the number burst out of its badge.
              <span
                title={`${count} món`}
                className="absolute -top-0.5 -right-0.5 bg-amber-500 text-green-950 text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center"
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>

          <Link
            href="/products"
            className="hidden md:inline-block bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition whitespace-nowrap"
          >
            {info.navbarCta}
          </Link>

          {items.length > 0 && (
            <button
              aria-label={open ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
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
          )}
        </div>
      </nav>

      {open && items.length > 0 && (
        <div id="mobile-nav" className="lg:hidden border-t border-green-100 bg-white">
          <ul className="px-4 py-4 space-y-1">
            {items.map((l) => (
              <li key={l.id}>
                <Link
                  href={l.href}
                  target={l.openInNewTab ? "_blank" : undefined}
                  rel={l.openInNewTab ? "noopener noreferrer" : undefined}
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
