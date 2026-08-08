'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  // Wrap the navigation in a transition so we can show a pending spinner while
  // the server re-renders the filtered grid — otherwise the shopper types and
  // sees stale results with no signal anything is happening.
  const [isNavPending, startNavTransition] = useTransition();
  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    startNavTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
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
  const activeFilterCount = Number(Boolean(q.trim())) + Number(Boolean(sort)) + Number(inStockOnly);
  const panelId = 'product-filter-panel';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 md:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-green-950">Lọc và sắp xếp</p>
          <p className="text-xs text-green-900/60">
            {activeFilterCount > 0 ? `${activeFilterCount} bộ lọc đang áp dụng` : 'Đang hiển thị toàn bộ kết quả'}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls={panelId}
          onClick={() => setMobileOpen((open) => !open)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-950"
        >
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-green-700 px-2 py-0.5 text-xs text-white tabular-nums">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <div
        id={panelId}
        className={`${mobileOpen ? 'mt-4 block' : 'hidden'} md:mt-0 md:block`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <div className="relative min-w-[200px] flex-1">
            <label htmlFor="catalog-search" className="mb-1 block text-sm font-medium text-green-950">
              Tìm sản phẩm
            </label>
            <span className="pointer-events-none absolute left-3 top-[calc(50%+0.75rem)] -translate-y-1/2 text-green-900/40" aria-hidden>
              ⌕
            </span>
            <input
              id="catalog-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tên sản phẩm, vùng trồng, chứng nhận…"
              aria-describedby="catalog-search-help"
              className="min-h-11 w-full rounded-2xl border border-green-200 bg-white py-2.5 pl-9 pr-10 text-sm text-green-950 focus:border-green-600 focus:ring-2 focus:ring-green-600/40"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-[calc(50%+0.75rem)] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-green-900/50 hover:bg-green-50 hover:text-green-900"
              >
                ✕
              </button>
            )}
            <p id="catalog-search-help" className="mt-1 text-xs text-green-900/55">
              Kết quả tự cập nhật khi bạn nhập hoặc đổi bộ lọc.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:flex md:items-end">
            <label className="block md:min-w-[200px]">
              <span className="mb-1 block text-sm font-medium text-green-950">Sắp xếp</span>
              <select
                value={sort}
                onChange={(e) => setParam({ sort: e.target.value })}
                aria-label="Sắp xếp"
                className="min-h-11 w-full rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm text-green-950"
              >
                <option value="">Phù hợp nhất</option>
                <option value="price-asc">Giá thấp → cao</option>
                <option value="price-desc">Giá cao → thấp</option>
                <option value="name">Tên A → Z</option>
              </select>
            </label>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm text-green-900 md:self-end">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setParam({ con: e.target.checked ? '1' : '' })}
                className="h-4 w-4 accent-green-700"
              />
              Chỉ hiện sản phẩm còn hàng
            </label>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {q.trim() && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="rounded-full border border-green-200 bg-[#f7faf3] px-3 py-1.5 text-xs font-medium text-green-900"
              >
                Từ khóa: {q}
              </button>
            )}
            {sort && (
              <button
                type="button"
                onClick={() => setParam({ sort: '' })}
                className="rounded-full border border-green-200 bg-[#f7faf3] px-3 py-1.5 text-xs font-medium text-green-900"
              >
                Bỏ sắp xếp
              </button>
            )}
            {inStockOnly && (
              <button
                type="button"
                onClick={() => setParam({ con: '' })}
                className="rounded-full border border-green-200 bg-[#f7faf3] px-3 py-1.5 text-xs font-medium text-green-900"
              >
                Đang lọc còn hàng
              </button>
            )}
          </div>
        )}
      </div>

      {/* Announce the new count to screen readers after a filter/search change,
          and show a spinner while the filtered grid is being fetched. */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-green-100 pt-4">
        <p className="text-sm text-green-900/65">
          So sánh nhanh theo giá, quy cách, tồn kho và nơi cung cấp.
        </p>
        <span role="status" aria-live="polite" className="flex shrink-0 items-center gap-1.5 text-xs text-green-900/50 tabular-nums">
          {isNavPending && <span className="h-3 w-3 animate-spin rounded-full border-2 border-green-300 border-t-green-600" aria-hidden />}
          {resultCount} sản phẩm
        </span>
      </div>
    </div>
  );
}
