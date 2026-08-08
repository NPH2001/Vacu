'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type CatalogView = {
  id: number;
  name: string;
  description: string;
  pages: string[];
};

/**
 * Catalog sản phẩm: thẻ bìa → bấm vào là mở trình xem lật từng trang.
 *
 * Bày theo hai kiểu như khối chứng nhận: `slider` cho trang chủ (một mục trong
 * trang dài), `grid` cho trang Catalog riêng (khách vào đúng để xem cho đủ).
 */
export default function CatalogShowcase({
  items, layout,
}: {
  items: CatalogView[];
  layout: 'slider' | 'grid';
}) {
  const [open, setOpen] = useState<CatalogView | null>(null);
  if (items.length === 0) return null;

  return (
    <>
      {layout === 'grid'
        ? (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((c) => <li key={c.id}><Card catalog={c} onOpen={setOpen} /></li>)}
          </ul>
        )
        : <Slider items={items} onOpen={setOpen} />}
      {open && <Viewer catalog={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Slider({ items, onOpen }: { items: CatalogView[]; onOpen: (c: CatalogView) => void }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft >= max - 2);
    const total = Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth)));
    setPages(total);
    setPage(max <= 0 ? 0 : Math.round((el.scrollLeft / max) * (total - 1)));
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    return () => { ro.disconnect(); el.removeEventListener('scroll', measure); };
  }, [measure]);

  const scrollByPage = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };
  const goToPage = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: (max / Math.max(1, pages - 1)) * i, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label="Danh sách catalog"
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar
                   scroll-px-1 pb-1 rounded-2xl focus-visible:outline-2 focus-visible:outline-green-700">
        {items.map((c) => (
          <li key={c.id} className="snap-start shrink-0 w-[70vw] sm:w-[44vw] md:w-[30%] lg:w-[23%]">
            <Card catalog={c} onOpen={onOpen} />
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <>
          <NavButton side="left" disabled={atStart} onClick={() => scrollByPage(-1)} />
          <NavButton side="right" disabled={atEnd} onClick={() => scrollByPage(1)} />
          <div className="flex justify-center gap-1 mt-5">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" onClick={() => goToPage(i)}
                aria-label={`Tới nhóm ${i + 1} trên ${pages}`}
                aria-current={i === page || undefined}
                className="group inline-flex h-11 min-w-11 items-center justify-center rounded-full">
                <span aria-hidden className={`h-2 rounded-full transition-all ${
                  i === page ? 'w-6 bg-green-700' : 'w-2 bg-green-700/25 group-hover:bg-green-700/50'
                }`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavButton({
  side, disabled, onClick,
}: { side: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      aria-label={side === 'left' ? 'Xem catalog trước' : 'Xem catalog tiếp theo'}
      className={`hidden md:flex absolute top-[38%] -translate-y-1/2 z-20 w-11 h-11 items-center justify-center
        rounded-full bg-white border border-green-100 shadow-lg text-green-900
        transition hover:bg-green-50 disabled:opacity-0 disabled:pointer-events-none
        ${side === 'left' ? '-left-3 lg:-left-5' : '-right-3 lg:-right-5'}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function Card({ catalog, onOpen }: { catalog: CatalogView; onOpen: (c: CatalogView) => void }) {
  const cover = catalog.pages[0];
  return (
    <button type="button" onClick={() => onOpen(catalog)}
      aria-label={`Mở catalog: ${catalog.name} (${catalog.pages.length} trang)`}
      className="group w-full h-full text-left">
      <div className="h-full flex flex-col bg-white rounded-2xl border border-green-100 overflow-hidden
        shadow-[0_1px_3px_rgba(20,60,30,0.06)] transition group-hover:shadow-xl group-hover:-translate-y-1">
        <div className="relative bg-stone-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={catalog.name} loading="lazy"
            className="w-full aspect-[3/4] object-cover object-top" />
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/92 border border-green-100
            text-[11px] font-medium text-green-900">
            {catalog.pages.length} trang
          </span>
        </div>
        <div className="p-3.5 flex-1 flex flex-col">
          <div className="font-semibold text-green-950 text-[14px] leading-snug line-clamp-2 wrap-anywhere">
            {catalog.name}
          </div>
          {catalog.description && (
            <div className="text-[12px] text-green-900/60 mt-1 line-clamp-2 wrap-anywhere">{catalog.description}</div>
          )}
          <span className="mt-2.5 text-[12px] font-medium text-green-700 group-hover:underline">
            Xem catalog →
          </span>
        </div>
      </div>
    </button>
  );
}

/** Trình xem lật trang: mũi tên trái/phải, bàn phím, đếm trang, tải trang hiện tại. */
function Viewer({ catalog, onClose }: { catalog: CatalogView; onClose: () => void }) {
  const [i, setI] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const total = catalog.pages.length;

  const go = useCallback((delta: number) => {
    setI((cur) => Math.min(total - 1, Math.max(0, cur + delta)));
  }, [total]);

  useEffect(() => {
    returnTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Lật trang bằng bàn phím: xem catalog 30 trang mà phải bấm chuột từng
      // trang thì không ai xem hết.
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      returnTo.current?.focus?.();
    };
  }, [onClose, go]);

  return (
    <div role="dialog" aria-modal="true" aria-label={catalog.name} onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-4xl w-full my-auto overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-green-100">
          <div className="min-w-0">
            <h3 className="font-bold text-green-950 font-display text-lg truncate">{catalog.name}</h3>
            <p className="text-[12.5px] text-green-900/60 tabular-nums">Trang {i + 1} / {total}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng"
            className="shrink-0 w-9 h-9 rounded-full hover:bg-green-50 text-green-900 text-xl leading-none">✕</button>
        </div>

        <div className="relative bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={catalog.pages[i]} alt={`${catalog.name} — trang ${i + 1}`}
            className="w-full max-h-[74vh] object-contain" />

          {total > 1 && (
            <>
              <PageButton side="left" disabled={i === 0} onClick={() => go(-1)} />
              <PageButton side="right" disabled={i === total - 1} onClick={() => go(1)} />
            </>
          )}
        </div>

        {/* Dải trang nhỏ để nhảy thẳng, thay vì bấm mũi tên hai chục lần. */}
        {total > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar p-3 border-t border-green-100">
            {catalog.pages.map((url, idx) => (
              <button key={idx} type="button" onClick={() => setI(idx)}
                aria-label={`Tới trang ${idx + 1}`}
                aria-current={idx === i || undefined}
                className={`shrink-0 w-11 rounded-md overflow-hidden ring-2 transition ${
                  idx === i ? 'ring-green-700' : 'ring-transparent hover:ring-green-300'
                }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" loading="lazy" className="w-full aspect-[3/4] object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-4 border-t border-green-100">
          {catalog.description
            ? <p className="text-[13px] text-green-900/70 line-clamp-2 wrap-anywhere">{catalog.description}</p>
            : <span />}
          <a href={catalog.pages[i]} download target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-[13px] font-medium text-green-700 hover:underline whitespace-nowrap">
            Tải trang này ↓
          </a>
        </div>
      </div>
    </div>
  );
}

function PageButton({
  side, disabled, onClick,
}: { side: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      aria-label={side === 'left' ? 'Trang trước' : 'Trang sau'}
      className={`absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-green-100
        shadow-lg text-green-900 flex items-center justify-center transition hover:bg-white
        disabled:opacity-0 disabled:pointer-events-none ${side === 'left' ? 'left-2' : 'right-2'}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
