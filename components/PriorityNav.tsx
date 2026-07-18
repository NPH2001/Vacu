'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MenuItemRow } from '@/db/schema';

const GAP = 28; // matches gap-x-7 (1.75rem)

/**
 * "Priority+" navigation: shows as many menu links as fit on one line and folds
 * the rest into a "Thêm ▾" dropdown, so the bar never grows to a second row or
 * pushes the cart/CTA off-screen no matter how many items the admin adds.
 *
 * A hidden full-width copy of the list is measured (it never changes), and a
 * ResizeObserver on the container recomputes how many fit whenever the space
 * changes. `overflow-hidden` on the visible row means even before this JS runs
 * (SSR / slow hydration) the bar clips rather than overflows.
 */
export default function PriorityNav({ items }: { items: MenuItemRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const moreRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [measured, setMeasured] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    // Callback (not the effect body) so setState here doesn't cascade-render.
    const compute = () => {
      const avail = container.clientWidth;
      const widths = Array.from(measure.children).map((el) => (el as HTMLElement).getBoundingClientRect().width);
      const moreW = (moreRef.current?.getBoundingClientRect().width ?? 56) + GAP;

      const fits = (reserveMore: boolean) => {
        let used = 0;
        let n = 0;
        for (let i = 0; i < widths.length; i++) {
          const w = widths[i] + (i > 0 ? GAP : 0);
          if (used + w + (reserveMore ? moreW : 0) <= avail) { used += w; n++; } else break;
        }
        return n;
      };

      const all = fits(false);
      setVisibleCount(all === items.length ? all : fits(true));
      setMeasured(true);
    };

    const ro = new ResizeObserver(compute);
    ro.observe(container);
    // Item widths shift once the display font finishes loading.
    document.fonts?.ready.then(compute).catch(() => {});
    return () => ro.disconnect();
  }, [items]);

  // Close the dropdown on outside click or Escape (keyboard users must be able
  // to dismiss it without tabbing through every item).
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpenMenu(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(false); };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);

  const linkProps = (l: MenuItemRow) => ({
    href: l.href,
    target: l.openInNewTab ? '_blank' : undefined,
    rel: l.openInNewTab ? 'noopener noreferrer' : undefined,
  });

  return (
    <div ref={containerRef} className="hidden lg:block flex-1 min-w-0 relative">
      {/* Measurement copy of the full list + the "Thêm" button. Wrapped in a
          0×0 overflow-hidden box: the row is wider than the screen, and
          `visibility:hidden` alone would still extend document scroll width and
          create a horizontal scrollbar. Clipping to 0×0 removes it from layout
          overflow while getBoundingClientRect still reports real child widths. */}
      <div aria-hidden className="absolute w-0 h-0 overflow-hidden pointer-events-none">
        {/* w-max so the 0-width wrapper doesn't shrink the flex children to
            nothing — each <li> must lay out at its natural label width for the
            measurement to be meaningful. */}
        <ul ref={measureRef} className="flex w-max gap-x-7 whitespace-nowrap text-sm font-medium">
          {items.map((l) => <li key={l.id} className="max-w-56 shrink-0 truncate">{l.label}</li>)}
        </ul>
        <span ref={moreRef} className="inline-block w-max text-sm font-medium">Thêm ▾</span>
      </div>

      {/* Clip only until the first measurement: before JS runs the row may hold
          all items and overflow, so hide it; afterwards the computed row always
          fits, and dropping the clip lets the "Thêm" dropdown escape the row. */}
      <ul className={`flex items-center justify-center gap-x-7 whitespace-nowrap text-sm font-medium text-green-900/80 ${measured ? '' : 'overflow-hidden'}`}>
        {visible.map((l) => (
          <li key={l.id}>
            <Link {...linkProps(l)} title={l.label} className="block max-w-56 truncate hover:text-green-700 transition">
              {l.label}
            </Link>
          </li>
        ))}

        {overflow.length > 0 && (
          <li className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenu((o) => !o)}
              aria-expanded={openMenu}
              aria-haspopup="menu"
              className="flex items-center gap-1 hover:text-green-700 transition"
            >
              Thêm
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition-transform ${openMenu ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {openMenu && (
              <div role="menu"
                className="absolute right-0 top-full mt-3 min-w-52 max-w-72 bg-white rounded-2xl border border-green-100 shadow-xl py-2 z-50">
                {overflow.map((l) => (
                  <Link key={l.id} {...linkProps(l)} role="menuitem"
                    onClick={() => setOpenMenu(false)}
                    className="block px-4 py-2.5 text-green-900 hover:bg-green-50 truncate">
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}
