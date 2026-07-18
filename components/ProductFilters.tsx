'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Search / sort / in-stock controls for the catalog. State lives in the URL
 * (?q=&sort=&con=) so results are shareable and the server does the filtering.
 */
export default function ProductFilters({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = params.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A one-shot token holding the value our own debounce just pushed to the URL,
  // awaiting its echo. When urlQ catches up to it we skip re-syncing the box
  // (else a keystroke typed during the router.replace round-trip is clobbered
  // back to the older debounced value) — and immediately CONSUME the token, so a
  // later Back/Forward that happens to land on the same value still re-syncs.
  // `null` = no push pending. State, not a ref, so it is safe to read in render.
  const [pending, setPending] = useState<string | null>(null);

  // Re-sync the box when the URL query changes from something other than typing
  // (Back/Forward, the "Tất cả" pill, "Xem tất cả" in the empty state). This is
  // the React "adjust state when a prop changes during render" pattern.
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    if (urlQ === pending) {
      setPending(null);         // our own echo — consume it, leave the box alone
    } else {
      setQ(urlQ);               // external navigation — re-sync the box
      setPending(null);         // any older pending push is now stale
    }
  }

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Debounce the search box so we don't navigate on every keystroke.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) { setPending(q); setParam({ q }); }
    }, 350);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const sort = params.get('sort') ?? '';
  const inStockOnly = params.get('con') === '1';

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-900/40">🔍</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm sản phẩm…"
          aria-label="Tìm sản phẩm"
          className="w-full pl-9 pr-3 py-2.5 rounded-full border border-green-200 bg-white text-sm focus:border-green-600 focus:ring-2 focus:ring-green-600/40"
        />
      </div>
      <select
        value={sort}
        onChange={(e) => setParam({ sort: e.target.value })}
        aria-label="Sắp xếp"
        className="py-2.5 px-4 rounded-full border border-green-200 bg-white text-sm"
      >
        <option value="">Mới nhất</option>
        <option value="price-asc">Giá thấp → cao</option>
        <option value="price-desc">Giá cao → thấp</option>
        <option value="name">Tên A → Z</option>
      </select>
      <label className="flex items-center gap-2 text-sm text-green-900/80 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setParam({ con: e.target.checked ? '1' : '' })}
          className="w-4 h-4 accent-green-700"
        />
        Còn hàng
      </label>
      {/* Announce the new count to screen readers after a filter/search change. */}
      <span role="status" aria-live="polite" className="text-xs text-green-900/50 tabular-nums ml-auto">{resultCount} sản phẩm</span>
    </div>
  );
}
