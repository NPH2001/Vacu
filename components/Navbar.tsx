"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MenuNode } from "@/lib/menu";
import { NestedLinkList } from "./NavDropdown";
import { useCart } from "./CartProvider";
import PriorityNav from "./PriorityNav";

// A narrowed view of site_info — NOT the whole SiteInfoRow. This is a Client
// Component, so every prop is serialized into the RSC payload embedded in the
// public HTML; handing it the full row would leak smtpPass and other secrets to
// anyone who views source. Only the fields actually rendered are accepted.
type NavbarInfo = { logoUrl: string | null; name: string; navbarCta: string; phone: string; hours: string };

export default function Navbar({ info, items }: { info: NavbarInfo; items: MenuNode[] }) {
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
    <header className="sticky top-0 z-50 border-b border-green-100/80 bg-white/95 shadow-[0_8px_30px_-24px_rgba(20,83,45,0.45)] backdrop-blur-xl">
      <div className="hidden border-b border-green-100 bg-green-950 text-green-50 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 text-sm">
          <p className="flex items-center gap-5 text-green-100/85">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> Nguồn gốc rõ ràng</span>
            <span>Đổi trả nếu sản phẩm không đạt</span>
            <span>{info.hours}</span>
          </p>
          <div className="flex items-center gap-5 font-semibold">
            <Link href="/orders" className="hover:text-lime-200">Tra cứu đơn</Link>
            <a href={`tel:${info.phone.replace(/\D/g, '')}`} className="hover:text-lime-200">Hotline {info.phone}</a>
          </div>
        </div>
      </div>

      <nav aria-label="Điều hướng chính" className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-3 py-3 md:gap-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex min-w-0 shrink-0 items-center gap-2.5 font-display text-2xl font-bold text-green-900 md:text-3xl"
          >
            {info.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={info.logoUrl} alt={info.name} className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-green-200" />
            ) : (
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-800 text-white" aria-hidden>V</span>
            )}
            <span className="hidden wrap-anywhere sm:inline">{info.name}</span>
          </Link>

          <form action="/products" method="get" role="search" className="relative hidden min-w-0 flex-1 md:block">
            <label htmlFor="site-search" className="sr-only">Tìm kiếm thực phẩm</label>
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-800/45">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" strokeLinecap="round" />
            </svg>
            <input id="site-search" name="q" type="search" placeholder="Tìm rau củ, trái cây, thịt cá, đặc sản OCOP…" className="h-12 w-full rounded-full border border-green-200 bg-green-50/60 pl-12 pr-28 text-base text-green-950 placeholder:text-green-900/45 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10" />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-green-800 px-5 py-2 text-base font-bold text-white transition hover:bg-green-900">Tìm kiếm</button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 md:gap-2">
            <Link href="/orders" aria-label="Tra cứu đơn hàng" className="hidden h-11 w-11 items-center justify-center rounded-full text-green-900 transition hover:bg-green-50 sm:flex md:hidden">
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" /></svg>
            </Link>
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Giỏ hàng"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-900 transition hover:bg-green-100"
          >
            <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M4 9h16l-1.4 10H5.4L4 9Z" strokeLinejoin="round" /><path d="m8 9 4-6 4 6" strokeLinecap="round" /></svg>
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
            className="hidden rounded-full bg-green-800 px-5 py-3 text-base font-bold text-white transition hover:bg-green-900 xl:inline-block"
          >
            {info.navbarCta}
          </Link>

          {items.length > 0 && (
            <button
              aria-label={open ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen(!open)}
              className="-mr-2 p-2 text-green-900 lg:hidden"
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
        </div>

        <div className="hidden min-h-11 items-center border-t border-green-100/80 lg:flex">
          {items.length > 0 && <PriorityNav items={items} />}
        </div>
      </nav>

      {open && items.length > 0 && (
        <div id="mobile-nav" className="border-t border-green-100 bg-white lg:hidden">
          <form action="/products" method="get" role="search" className="relative mx-4 mt-4 md:hidden">
            <label htmlFor="mobile-site-search" className="sr-only">Tìm kiếm thực phẩm</label>
            <input id="mobile-site-search" name="q" type="search" placeholder="Bạn muốn mua gì hôm nay?" className="h-12 w-full rounded-full border border-green-200 bg-green-50/60 px-4 pr-12 text-base" />
            <button type="submit" aria-label="Tìm kiếm" className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-green-800 text-white">
              <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" strokeLinecap="round" /></svg>
            </button>
          </form>
          {/* Xổ hết mọi cấp, thụt lề theo cấp: trong ngăn kéo hẹp trên điện
              thoại, bắt bấm từng cấp để mở tiếp là thêm một rào cản không cần thiết. */}
          <ul className="px-1 py-3">
            <NestedLinkList nodes={items} onNavigate={() => setOpen(false)} />
          </ul>
          <div className="grid grid-cols-2 gap-2 border-t border-green-100 p-4 text-base font-semibold">
            <Link href="/orders" onClick={() => setOpen(false)} className="rounded-xl bg-green-50 px-3 py-3 text-center text-green-900">Tra cứu đơn</Link>
            <a href={`tel:${info.phone.replace(/\D/g, '')}`} className="rounded-xl bg-green-800 px-3 py-3 text-center text-white">Gọi {info.phone}</a>
          </div>
        </div>
      )}
    </header>
  );
}
